const fs = require('fs-extra');
const ora = require('ora');
const { series } = require('async');

const { exportStrings, getLocalization } = require('../api');
const getProjectConfig = require('../utils/getProjectConfig');
const { writeProjectLock } = require('../utils/projectLock');
const { resolveLocalizationPath } = require('../utils/path');

const Log = require('../utils/log');

module.exports = function(config){

    const projectConfig = getProjectConfig(config);

    let downloadTasks = [];

    for(const project of projectConfig.projects){

        for(const localization of project.localizations){

            const logPrefix = Log.getLocalizationPrefix(project, localization);
            let filePaths = [];

            try {

                filePaths.push(resolveLocalizationPath(config, localization.path));

                if(localization.mirrors){

                    for(let mirror of localization.mirrors){
                        filePaths.push(resolveLocalizationPath(config, mirror));
                    }
                }
            }
            catch(e){
                throw `${logPrefix} ${e}`;
            }

            downloadTasks.push((callback) => {

                const spinner = ora(`${logPrefix} Downloading translations...`).start();

                let localizationData = null;

                getLocalization(config, project.id, localization.locale)
                    .then(data => {

                        localizationData = data;

                        return exportStrings(config, project.id, localization.locale, projectConfig.format);
                    })
                    .then(strings => {

                        spinner.stop();

                        const savePromises = filePaths.map(filePath => {

                            return fs.writeFile(filePath, strings).then(() => {
                                Log.info(`${logPrefix} Saved at ${filePath}`);
                            })
                        });

                        return Promise.all(savePromises);
                    })
                    .then(() => {

                        callback(null, {
                            projectId: project.id,
                            locale: localization.locale,
                            ...localizationData
                        });
                    })
                    .catch(e => {

                        spinner.stop();
                        callback(e);
                    });
            });
        }
    }

    Log.log(`> Pulling ${downloadTasks.length} localizations...`);

    series(downloadTasks, (e, data) => {

        if(e){
            Log.error(e);
        }
        else {

            // Update lockfile
            let lockProjects = [];

            for(const project of projectConfig.projects){

                const localizations = data.filter(itm => itm.projectId === project.id);

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
                Log.info('Saved lockfile, please push this file to your repository.');
            }
            catch(e){

                console.error(e);
                Log.error('Couldn\'t write lock file');
            }

            Log.success('Done');
        }
    });
};