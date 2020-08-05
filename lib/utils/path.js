const path = require('path');
const glob = require("glob");

function resolveLocalizationPath(config, pathPattern, relative=false){

    if(!pathPattern){
        throw `No path set"`
    }

    let filePath = null;

    if(glob.hasMagic(pathPattern)){

        // Use glob
        const pathCandidates = glob.sync(pathPattern, {
            cwd: config.paths.project
        });

        if(pathCandidates.length === 0){
            throw `No files found matching pattern ${pathPattern}`;
        }
        else if(pathCandidates.length > 1){
            throw `Multiple files found matching pattern ${pathPattern}`;
        }

        filePath = path.join(config.paths.project, pathCandidates[0]);
    }
    else {

        filePath = path.join(config.paths.project, pathPattern);
    }

    if(filePath && relative){
        filePath = path.relative(config.paths.project, filePath);
    }

    return filePath;
}

module.exports = {
    resolveLocalizationPath
};