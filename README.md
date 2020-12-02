tide-backup
===========

Utility for backing up remote servers. It compresses and downloads folders and exports, compresses and downloads databases using mysqldump.

It runs on nodejs and a unix environment with zero dependencies.

A configuration json is required with the following parameters:

|Parameter    | description
|-------------|------------
|destination  | The path on the local machine where the backups will be saved
|logFile      | Path including name to the log file. Logs will be appended and the folder recursively created if it doesn't exist
|heartbeat    | An object describing a server yo make an http call every time the backup process runs. If any backup fails the call will not be made
|heartbeat.url | The url to call. Including protocol, hostname, path and query in a string
|heartbeat.*   | Any other property accepted by node's [http.request](https://nodejs.org/api/http.html#http_http_request_url_options_callback) options parameter
|projects      | Array of projects to back up sequentially 
|projects[].name | The project name used for naming backups
|projects[].host | The ssh host including the user like "user@example.com" from where the backups will be made
|projects[].backupCount | Number of backups to save. All backups exceeding this number will be deleted counting after downloading the backup.
|projects[].folders| Array of folders to download, each will be `tar`ed, `gzip`ed and downloaded. Specify the full path either from root or from the ssh users home.
|projects[].databases| Array of objects specifying the database details for downloading.
|projects[].databases[].name| The database name
|projects[].databases[].user| The database user
|projects[].databases[].password| The database password
|remoteTempFolder| Temporal folder in the remote server used for storing the sql dump before downloading.
