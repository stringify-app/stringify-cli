const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');
const ora = require('ora');

const { getProjects } = require('../api');
const { writeProjectConfig } = require('../utils/projectConfig');

const Log = require('../utils/log');

const find = require('lodash/find');

module.exports = function(config){

    const projectConfigPath = path.join(config.paths.project, config.projectConfigFile);

    if(fs.existsSync(projectConfigPath)){
        throw 'Project config file already exists, please delete it first.';
    }

    const spinner = ora('Loading projects').start();

    let projects = null;

    getProjects(config).then(projectsResponse => {

        spinner.stop();

        projects = projectsResponse;
        if(!projects){
            throw 'Invalid API response'
        }

        const projectOptions = projects.map(project => ({
            name: project.title,
            value: project.id
        }));

        return inquirer.prompt([
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

    }).then(options => {

        const project = find(projects, { id: options.project });
        const format = find(config.formats, { id: options.format });

        const configFile = {
            format: options.format,
            projects: [
                {
                    id: project.id,
                    name: project.title,
                    localizations: options.localizations.map(locale => ({
                        locale,
                        path: format.defaultPath.replace('[locale]', locale)
                    }))
                }
            ]
        };

        writeProjectConfig(config, configFile);

    }).then(() => {

        Log.success(`Created Stringify config file at ${projectConfigPath}`);

    }).catch(e => {

        spinner.stop();
        Log.error(e);
    });
};