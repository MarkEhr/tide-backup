const fs = require("fs");
const {dirname, basename, join} = require("path");
const {execSync} = require("child_process");
const https = require('https');
const http = require('http');
const httpProtocols={'http:':http, 'https:':https};
const {log, dateString} = require("./util");

/**
 *
 * @param host {string} ssh host including the user name e.g. user@domain.com
 * @param folder {string} Remote folder to download, can be an absolute path or relative to the ssh user's home
 * @param destination {string} Local folder to place the downloaded compressed folder
 */
const downloadFolder = ( host, folder, destination )=>{

    const backupName = (folder+'').replace(/\//g,'_')+'-'+dateString()+'.tar.gz';

    if(!fs.existsSync(destination))
        fs.mkdirSync(destination, {recursive: true});

    const tarCommand = [ '"tar -czpf - -C', dirname(folder), basename(folder)+'"'];
    const command = ["ssh", host, tarCommand.join(" "), '>', '"'+join(destination, backupName)+'"' ];

    return execSync(command.join(" "));
}

const escapePassword = (pass)=>{
    return (pass+"").replace('`','\\`');
}

/**
 *
 * @param host
 * @param databases {array}
 * @param destination
 * @param remoteTempFolder
 */
const downloadDatabases = (host, databases, destination, remoteTempFolder="/tmp")=>{

    const folder = join(remoteTempFolder, "tide-bk-"+(Math.random()+"").substring(2));
    try{
        execSync(`ssh ${host} "mkdir -p ${folder}"`);
    } catch (e){
        log("Couldn't create remote temporal folder. "+e);
        return;
    }

    let success = true;
    for (let i=0; i<databases.length; i++){
        try {
            const file = join(folder, `${databases[i].name}.sql.gz`);
            const dumpCommand = [`MYSQL_PWD='${escapePassword(databases[i].password)}'`, 'mysqldump', '--no-tablespaces ', '--quick', `'-u${databases[i].user}'`, databases[i].name, '| gzip >', file];
            const command = ["ssh", host, `"${dumpCommand.join(' ')}"`];
            execSync(command.join(" "));
        } catch (e){
            log("Error dumping database "+databases[i].name+" : "+e, "error");
            success=false;
        }
    }

    downloadFolder(host, folder, join(destination, 'databases') );
    execSync(`ssh ${host} "rm -rf ${folder}"`);
    return success;
}

/**
 * @param project {{ name, folders, host }}
 * @param destination { string }
 */
const downloadProject = async ( project, destination )=>{

    if(!project.name)
        throw new Error("Missing name parameter");

    log("Backing up project "+project.name);
    const fullDestination = join(destination, project.name, dateString());
    let success = true;

    // Download folders
    if (project.folders && project.host) {
        log("Compressing and downloading folders: "+project.folders.join(", "))
        for (let j = 0; j < project.folders.length; j++) {
            try {
                downloadFolder(project.host, project.folders[j], fullDestination, project.name);
            } catch (e) {
                success=false;
                log("Failed to download folder: "+project.folders[j]);
            }
        }
    }
    // Download databases
    if(project.databases){
        log("Compressing and downloading databases: "+project.databases.map(d=>d.name).join(", "));
        success = success && downloadDatabases(project.host, project.databases, fullDestination, project.remoteTempFolder);
    }

    return success;
}

const cleanOldBackups = ( project, destination )=>{
    const folder = join(destination, project.name);
    if(!fs.existsSync(folder))
        throw new Error("Couldn't find folder while cleaning up oldies: "+folder);
    const backups = fs.readdirSync(folder);
    const backupCount = project.backupCount || 3;
    if(backupCount === -1)
        return;
    backups.sort();
    for(let i=0; i<backupCount; i++)
        backups.pop();
    if(!backups.length)
        return;
    log(`Removing ${backups.length} old backups`);
    for(let i=0; i<backups.length; i++){
        const bkFolder = join(folder, backups[i]);
        execSync(`rm -rf "${bkFolder}"`);
    }
}

/**
 *
 * @param options {{
 *      url: string,
 *      method: "GET"|"POST"|"PUT",
 *      headers: object
 *      }}
 * @param body {string|Buffer}
 * @returns {Promise<void>}
 */
const httpCall =  (options, body=null)=>new Promise((resolve,reject) => {
    if(!options.url)
        reject("No url provided for http call");
    const req = httpProtocols[(new URL(options.url)).protocol].request(options.url, options, res => {
        const chunks = [];
        res.on('data', data => chunks.push(data))
        res.on('end', () => {
            let body = Buffer.concat(chunks);
            resolve(body)
        })
    })
    req.on('error',reject);
    if(body)
        req.write(body);
    req.end();
})

const heartbeatCall = async ( options )=>{
    const res = await httpCall(options);
    log("Successful heartbeat call. Response: "+res);
}

module.exports = {
    cleanOldBackups,
    downloadFolder,
    downloadProject,
    heartbeatCall,
    httpCall
}
