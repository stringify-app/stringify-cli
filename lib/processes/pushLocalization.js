const fs = require('fs-extra');
const ora = require('ora');
const chalk = require('chalk');
const inquirer = require('inquirer');
const moment = require('moment');

const pullArray = require('lodash/pull');

const Log = require('../utils/log');

const { resolveLocalizationPath } = require('../utils/path');
const { inspectStrings, importStrings } = require('../api');

const Mutations = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE'
};

const LOG_LINE = '-------------------------------------------------';
const LOG_CONFLICT = chalk.red.bold('[CONFLICT]');
const LOG_DELETED = chalk.redBright('deleted');
const LOG_EMPTY = chalk.yellow('empty');

module.exports = async function(config, project, localization, format, referenceVersion=null, force=false){

    const logPrefix = Log.getLocalizationPrefix(project, localization.locale);

    let spinner = ora(`${logPrefix} Inspecting changes...`).start();
    let inspect = null;

    try {

        const filePath = resolveLocalizationPath(config, localization.path);
        let localFile = null;

        try {
            localFile = await fs.readFile(filePath, 'utf8');
        }
        catch(e){
            throw `Unable to read file ${filePath}`;
        }

        if(!localFile.length){

            spinner.stop();
            Log.warning(`${logPrefix} Skipping push because of empty strings file at ${filePath}`);
            throw { skip: true };
        }

        const inspectResult = await inspectStrings(config, project.id, localization.locale, format, localFile, referenceVersion);

        if(!inspectResult){
            throw 'Invalid inspection response';
        }

        spinner.stop();
        spinner = null;

        inspect = inspectResult.data;
        const { created, updated, deleted } = inspect;
        const mutationCount = created.length + updated.length + deleted.length;

        if(!mutationCount){
            Log.log(`${logPrefix} No changes to push`);
            throw { skip: true };
        }

        Log.info(`${logPrefix} Found ${mutationCount} ${mutationCount === 1 ? 'mutation' : 'mutations'}`);

        let mutations = created.map(itm => ({
            type: Mutations.CREATE,
            ...itm
        })).concat(updated.map(itm => ({
            type: Mutations.UPDATE,
            ...itm
        }))).concat(deleted.map(itm => ({
            type: Mutations.DELETE,
            ...itm
        })))

        // Log summary
        const indent = chalk.bold('    ');

        for(const item of mutations){

            let typeLog = '';
            if(item.type === Mutations.CREATE){
                typeLog = chalk.green.bold('create:');
            }
            else if(item.type === Mutations.UPDATE){
                typeLog = chalk.yellow.bold('update:');
            }
            else if(item.type === Mutations.DELETE){
                typeLog = chalk.red.bold('delete: ');
            }

            Log.log(`${indent}${typeLog} ${item.key} ${item.conflict ? LOG_CONFLICT : ''}`);
        }

        // Resolve conflicts
        const conflictItems = mutations.filter(itm => !!itm.conflict);

        // In force mode, throw exception (user action is required)
        if(force && conflictItems.length){
            throw `${conflictItems.length} Conflict(s) found, please run this command again without the --force flag to resolve the conflicts`
        }

        for(const item of conflictItems){

            const conflict = item.conflict;

            const userFullName = `${conflict.user.firstName} ${conflict.user.lastName}`;
            const formattedConflictDate = moment(conflict.date).format('LLL');

            let conflictValue = conflict.value;
            if(conflict.deleted){
                conflictValue = LOG_DELETED;
            }
            else if(conflictValue === null){
                conflictValue = LOG_EMPTY;
            }

            let myValue = item.value;
            if(item.type === Mutations.DELETE){
                myValue = LOG_DELETED;
            }
            else if(myValue === null){
                myValue = LOG_EMPTY;
            }

            Log.log("\n");
            Log.log(`${LOG_CONFLICT} ${chalk.bold(item.key)}`);
            Log.log(LOG_LINE);

            Log.log(chalk.cyan(`${indent}1) ${chalk.bold(userFullName)} - ${formattedConflictDate}`));
            Log.log(`${indent}${conflictValue}`);

            Log.log("\n");

            Log.log(chalk.cyan(`${indent}2) ${chalk.bold('Mine')}`));
            Log.log(`${indent}${myValue}`);

            Log.log(LOG_LINE);
            Log.log("\n");

            const { keepLocal } = await inquirer.prompt([{
                type: 'list',
                name: 'keepLocal',
                message: 'Which version do you want to keep?',
                choices: [
                    { name: `1) ${userFullName}`, value: false },
                    { name: `2) Mine`, value: true }
                ]
            }]);

            if(!keepLocal){
                pullArray(mutations, item);
            }
        }

        Log.log("\n");

        let translated = false;

        if(!force) {

            const confirmQuestions = [{
                type: 'confirm',
                name: 'confirm',
                message: `${logPrefix} Are you sure you want to push the mutations?`
            }];

            const createCount = mutations.filter(itm => itm.type === Mutations.CREATE).length;
            if(createCount > 0){

                confirmQuestions.unshift({
                    type: 'confirm',
                    name: 'translated',
                    message: `${logPrefix} Do you want to mark the created strings as translated?`
                })
            }

            const confirmResults = await inquirer.prompt(confirmQuestions);
            if (!confirmResults.confirm) {
                throw { skip: true };
            }

            translated = confirmResults.translated;
        }

        let save = mutations
            .filter(itm => itm.type === Mutations.CREATE || itm.type === Mutations.UPDATE)
            .map(item => ({ key: item.key, value: item.value }));

        let delete_ = mutations
            .filter(itm => itm.type === Mutations.DELETE)
            .map(item => ({ key: item.key }));

        if(!save.length && !delete_.length){
            throw { skip: true };
        }

        spinner = ora(`Pushing changes...`).start();

        const importResult = await importStrings(config, {
            projectId: project.id,
            locale: localization.locale,
            translated,
            save, delete: delete_
        });

        if(!importResult.importStrings){
            throw 'Push failed, invalid server response';
        }

        spinner.stop();
        spinner = null;

        Log.log("\n");
    }
    catch(e){

        if(spinner){
            spinner.stop();
        }

        throw e;
    }
}