const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');
const ora = require('ora');

const { getProjects } = require('../api');
const { writeProjectConfig } = require('../utils/projectConfig');

const Log = require('../utils/log');
const { resolveLocalizationPath } = require('../utils/path');

const find = require('lodash/find');

module.exports = async function(config, program){

    const force = program.force;
    const projectConfigPath = path.join(config.paths.project, config.projectConfigFile);

    if(fs.existsSync(projectConfigPath) && !force){
        throw 'Project config file already exists, please delete it first or run again with --force flag';
    }

    const spinner = ora('Loading projects').start();

    try {

        let projects = await getProjects(config);
        if(!projects){
            throw 'Invalid API response'
        }

        spinner.stop();

        const projectOptions = projects.map(project => ({
            name: project.title,
            value: project.id
        }));

        const options = await inquirer.prompt([
            {
                type: 'list',
                name: 'project',
                message: 'Project',
                choices: projectOptions
            },
            {
                type: 'checkbox',
                name: 'localizations',
                message: 'Choose localizations',
                choices: (session) => {

                    const project = find(projects, { id: session.project });

                    return project.localizations.items.map(localization => ({
                        name: localization.locale.title,
                        value: localization.locale.id,
                        checked: true
                    }))
                }
            },
            {
                type: 'list',
                name: 'format',
                message: 'Format',
                choices: config.formats.map(format => ({
                    name: format.name,
                    value: format.id
                }))
            }
        ]);

        const project = find(projects, { id: options.project });
        const format = find(config.formats, { id: options.format });

        Log.log('> Configuring locale files:');

        const localePaths = {};

        for(let locale of options.localizations){

            const logPrefix = Log.getLocalizationPrefix(project, locale);
            const defaultPath = format.defaultPath.replace('[locale]', locale);
            let resolvedPath = null;

            try {

                resolvedPath = resolveLocalizationPath(config, defaultPath, true);
            }
            catch(e){}

            if(resolvedPath){

                Log.info(`${logPrefix} Using locale file ${resolvedPath}`);
                localePaths[locale] = resolvedPath;
                continue;
            }

            const pathResult = await inquirer.prompt([{
                type: 'input',
                name: 'path',
                message: `${logPrefix} Please enter path for locale file`,
                default: defaultPath
            }]);

            localePaths[locale] = pathResult.path
        }

        const configFile = {
            format: options.format,
            projects: [
                {
                    id: project.id,
                    name: project.title,
                    localizations: options.localizations.map(locale => ({
                        locale,
                        path: localePaths[locale]
                    }))
                }
            ]
        };

        writeProjectConfig(config, configFile);

        Log.success(`Created Stringify config file at ${projectConfigPath}`);
    }
    catch(e){

        spinner.stop();
        Log.error(e);
    }
};