const fs = require('fs-extra');
const ora = require('ora');
const { series } = require('async');

const { exportStrings } = require('../api');
const getProjectConfig = require('../utils/getProjectConfig');
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

                exportStrings(config, project.id, localization.locale, projectConfig.format)
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

                        callback();
                    })
                    .catch(e => {

                        spinner.stop();
                        callback(e);
                    });
            });
        }
    }

    Log.log(`> Pulling ${downloadTasks.length} localizations...`);

    series(downloadTasks, (e) => {

        if(e){
            Log.error(e);
        }
        else {
            Log.success('Done');
        }
    });
};