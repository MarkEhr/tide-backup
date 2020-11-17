const config = require("./config.json");
const { initializeLogs, log} = require('./util');
const { downloadProject, heartbeatCall} = require("./functions");

initializeLogs(config.logFile);
log("/\\/\\/\\--- Starting backups ---/\\/\\/\\");


const run = async ()=> {
    let success = true;
    for (let i = 0; i < config.projects.length; i++) {
        try {
            success = success && await downloadProject(config.projects[i], config.destination);
        }
        catch (e){
            log("Error backing up project "+i+": "+e, "error");
        }
    }

    if(config.heartbeat && success) {
        try {
            await heartbeatCall(config.heartbeat);
        } catch (e) {
            log("Heartbeat call failed with error: " + e, "error");
            log("Heartbeat parameters: " + JSON.stringify(config.heartbeat), "error");
        }
    }
    else if(config.heartbeat){
        log("Not all backups succeed. Preventing heartbeat");
    }


}
run()
    .then(async ()=>{
        log("/\\/\\/\\--- Finished backups ---/\\/\\/\\")
    })
    .catch((e)=>{
        log("Error: "+e);
        log("/\\/\\/\\--- Failed backups ---/\\/\\/\\", "error")
    })

