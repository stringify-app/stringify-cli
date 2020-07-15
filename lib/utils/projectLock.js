const path = require('path');
const fs = require('fs-extra');

function writeProjectLock(config, data){

    const projectLockPath = path.join(config.paths.project, config.projectLockFile);

    fs.writeFileSync(projectLockPath, JSON.stringify(data, null, 4));
}

function readProjectLock(config){

    const projectLockPath = path.join(config.paths.project, config.projectLockFile);

    if(!fs.existsSync(projectLockPath)){
        return null;
    }

    const projectLockJson = fs.readFileSync(projectLockPath, 'utf8');
    const projectLock = projectLockJson ? JSON.parse(projectLockJson) : null;

    if(!projectLock){
        throw 'Invalid project lock format';
    }

    return projectLock
}

module.exports = { writeProjectLock, readProjectLock };