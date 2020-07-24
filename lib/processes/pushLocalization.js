const fs = require('fs-extra');
const ora = require('ora');
const chalk = require('chalk');
const inquirer = require('inquirer');

const Log = require('../utils/log');

const { resolveLocalizationPath } = require('../utils/path');
const { inspectStrings, importStrings } = require('../api');

const Mutations = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE'
};

module.exports = function(config, project, localization, format, referenceVersion=null){

    const logPrefix = Log.getLocalizationPrefix(project, localization);

    let spinner = ora(`${logPrefix} Inspecting changes...`).start();
    let inspect = null;

    let filePath = null;

    try {
        filePath = resolveLocalizationPath(config, localization.path);
    }
    catch(e){
        throw `${logPrefix} ${e}`;
    }

    return fs.readFile(filePath, 'utf8').then(localFile => {

        return inspectStrings(config, project.id, localization.locale, format, localFile, referenceVersion);

    }).then(inspectResult => {

        if(!inspectResult){
            throw 'Invalid inspection responses';
        }

        spinner.stop();
        spinner = null;

        inspect = inspectResult.data;
        const { created, updated, deleted } = inspect;
        const mutationCount = created.length + updated.length + deleted.length;

        if(!mutationCount){
            Log.info(`${logPrefix} No changes to push`);
            throw { skip: true };
        }

        let mutationOptions = [];

        Log.info(`${logPrefix} Found ${mutationCount} mutations`);

        if(created.length) {

            for (const item of created) {
                Log.log(chalk.green.bold('    created: ') + item.key);
            }

            mutationOptions.push({ value: Mutations.CREATE, name: `Create (${created.length})`, checked: true });
        }

        if(updated.length) {

            for (const item of updated) {
                Log.log(chalk.yellow.bold('    updated: ') + item.key);
            }

            mutationOptions.push({ value: Mutations.UPDATE, name: `Update (${updated.length})`, checked: true });
        }

        if(deleted.length) {

            for (const item of deleted) {
                Log.log(chalk.red.bold('    deleted: ') + item.key);
            }

            mutationOptions.push({ value: Mutations.DELETE, name: `Delete (${deleted.length})`, checked: true });
        }

        Log.log("\n");

        return inquirer.prompt([
            {
                type: 'checkbox',
                name: 'mutations',
                message: 'Which mutations do you want to push?',
                choices: mutationOptions
            },
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Are you sure you want to push the mutations?'
            }
        ]);

    }).then(choices => {

        const mutations = choices.mutations;

        let save = [];
        let delete_ = [];

        if(mutations.indexOf(Mutations.CREATE) >= 0){
            save = save.concat(inspect.created.map(item => ({ key: item.key, value: item.value })));
        }
        else if(mutations.indexOf(Mutations.UPDATE) >= 0){
            save = save.concat(inspect.updated.map(item => ({ key: item.key, value: item.value })));
        }
        if(mutations.indexOf(Mutations.DELETE) >= 0){
            delete_ = inspect.deleted.map(item => ({ key: item.key }));
        }

        if(!save.length && !delete_.length){
            throw { skip: true };
        }

        spinner = ora(`Pushing changes...`).start();

        return importStrings(config, {
            projectId: project.id,
            locale: localization.locale,
            save, delete: delete_
        });

    }).then(() => {

        spinner.stop();
        spinner = null;

        Log.success(`Mutations pushed successfully`);
        Log.log("\n");

    }).catch(e => {

        if(spinner){
            spinner.stop();
        }

        throw e;
    });
}