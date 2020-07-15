const path = require('path');
const fs = require('fs-extra');

function writeProjectLock(config, data){

    const projectLockPath = path.join(config.paths.project, config.projectLockFile);

    fs.writeFileSync(projectLockPath, JSON.stringify(data, null, 4));
}

module.exports = { writeProjectLock };