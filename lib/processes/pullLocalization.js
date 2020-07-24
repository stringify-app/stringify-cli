const fs = require('fs-extra');
const ora = require('ora');

const { exportStrings, getLocalization } = require('../api');
const { resolveLocalizationPath } = require('../utils/path');

const Log = require('../utils/log');

module.exports = function(config, project, localization, format){

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

    const spinner = ora(`${logPrefix} Downloading translations...`).start();

    let localizationData = null;

    return getLocalization(config, project.id, localization.locale)
        .then(data => {

            localizationData = data;

            return exportStrings(config, project.id, localization.locale, format);
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

            return {
                projectId: project.id,
                locale: localization.locale,
                ...localizationData
            }
        })
        .catch(e => {

            spinner.stop();
            throw e;
        });
}