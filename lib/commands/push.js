const { series } = require('async');
const find = require('lodash/find');

const { readProjectConfig } = require('../utils/projectConfig');
const { readProjectLock } = require('../utils/projectLock');

const pushLocalization = require('../processes/pushLocalization');

const Log = require('../utils/log');

module.exports = function(config){

    const projectConfig = readProjectConfig(config);
    const projectLock = readProjectLock(config);

    let importTasks = [];

    for(const project of projectConfig.projects){

        const projectLockData = projectLock ? find(projectLock.projects, { projectId: project.id }) : null;

        for(const localization of project.localizations){

            const localizationLockData = projectLockData ? find(projectLockData.localizations, { locale: localization.locale }) : null;
            const referenceVersion = localizationLockData ? localizationLockData.version : null;

            importTasks.push((callback) => {

                pushLocalization(config, project, localization, projectConfig.format, referenceVersion)
                    .then(() => callback())
                    .catch(e => callback(!e.skip ? e : null))
            });
        }
    }

    Log.log(`> Pushing ${importTasks.length} localizations...`);

    series(importTasks, (e) => {

        if(e){
            Log.error(e);
        }
        else {
            Log.success('Done');
        }
    });
};