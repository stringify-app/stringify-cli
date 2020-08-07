const { readProjectConfig } = require('../utils/projectConfig');
const { writeProjectLock } = require('../utils/projectLock');

const pullLocalization = require('../processes/pullLocalization')

const Log = require('../utils/log');

module.exports = async function(config){

    const projectConfig = readProjectConfig(config);

    Log.info(`> PULLING STRINGS...`);
    Log.log("\n");

    try {

        let pullResults = [];

        for (const project of projectConfig.projects) {

            for (const localization of project.localizations) {

                const result = await pullLocalization(config, project, localization, projectConfig.format);
                pullResults.push(result);
            }
        }

        // Update lockfile
        let lockProjects = [];

        for(const project of projectConfig.projects){

            const localizations = pullResults.filter(itm => itm.projectId === project.id);

            lockProjects.push({
                projectId: project.id,
                localizations: localizations.map(itm => ({
                    locale: itm.locale,
                    version: itm.version
                }))
            })
        }

        try {

            writeProjectLock(config, { projects: lockProjects });
            Log.log('Saved lockfile, please push this file to your repository.');
        }
        catch(e){

            console.error(e);
            Log.error('Couldn\'t write lock file');
        }

        Log.success('Pull done');
        return true
    }
    catch(e){

        Log.error(e);
        return false
    }
};