const fs = require('fs');

let logStream={current:null};

const initializeLogs = (file='tide-backup.log')=>{
    //logStream.current = fs.createWriteStream(file, {flags:'a'});
    logStream.file=file;
}

const pad = (str, size=2, char=" ")=>{
    const res = str+'';
    if(res.length < size)
        return pad(char+res, size-1, char);
    return res;
}
const zeroPad = (str, size)=>pad(str, size, "0");

const dateString = ( dateParam )=>{
    const date = dateParam || new Date();
    return date.getFullYear()+     '-'+
        zeroPad(date.getMonth())+  '-'+
        zeroPad(date.getDate())+   'T'+
        zeroPad(date.getHours())+  ':'+
        zeroPad(date.getMinutes())+':'+
        zeroPad(date.getSeconds());
}
const log = ( msg, type="info" )=>{
    console.log(msg);
    fs.appendFileSync(logStream.file, '['+dateString()+'] ['+pad(type, 6)+'] '+ msg + "\n");
}

module.exports = {
    dateString,
    initializeLogs,
    log,
};
