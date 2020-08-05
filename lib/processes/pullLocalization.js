const fs = require('fs-extra');
const ora = require('ora');

const { exportStrings, getLocalization } = require('../api');
const { resolveLocalizationPath } = require('../utils/path');

const Log = require('../utils/log');

module.exports = async function(config, project, localization, format){

    const logPrefix = Log.getLocalizationPrefix(project, localization.locale);
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

    const spinner = ora(`${logPrefix} Downloading strings...`).start();

    try {

        const localizationData = await getLocalization(config, project.id, localization.locale);
        const strings = await exportStrings(config, project.id, localization.locale, format);

        spinner.stop();

        for (let filePath of filePaths) {

            await fs.writeFile(filePath, strings);
            Log.info(`${logPrefix} Saved at ${filePath}`);
        }

        return {
            projectId: project.id,
            locale: localization.locale,
            ...localizationData
        };
    }
    catch(e){

        spinner.stop();
        throw e;
    }
}