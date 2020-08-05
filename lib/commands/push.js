const find = require('lodash/find');

const { readProjectConfig } = require('../utils/projectConfig');
const { readProjectLock } = require('../utils/projectLock');

const pushLocalization = require('../processes/pushLocalization');

const Log = require('../utils/log');

module.exports = async function(config){

    const projectConfig = readProjectConfig(config);
    const projectLock = readProjectLock(config);

    Log.log(`> Pushing strings...`);

    try {

        for (const project of projectConfig.projects) {

            const projectLockData = projectLock ? find(projectLock.projects, {projectId: project.id}) : null;

            for (const localization of project.localizations) {

                const localizationLockData = projectLockData ? find(projectLockData.localizations, {locale: localization.locale}) : null;
                const referenceVersion = localizationLockData ? localizationLockData.version : null;

                try {
                    await pushLocalization(config, project, localization, projectConfig.format, referenceVersion);
                }
                catch(e){

                    if(!e.skip){
                        throw e;
                    }
                }
            }
        }

        Log.success('Push done');
        return true
    }
    catch(e){

        Log.error(e);
        return false
    }
};