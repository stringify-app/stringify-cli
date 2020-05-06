const path = require('path');
const fs = require('fs-extra');

module.exports = function(config){

    const projectConfigPath = path.join(config.paths.project, config.projectConfigFile);

    if(!fs.existsSync(projectConfigPath)){
        throw 'Project config file not found, please run "stringify init" first';
    }

    const projectConfigJson = fs.readFileSync(projectConfigPath, 'utf8');
    const projectConfig = projectConfigJson ? JSON.parse(projectConfigJson) : null;

    if(!projectConfig){
        throw 'Invalid project config format';
    }

    return projectConfig
};