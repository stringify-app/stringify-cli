const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs-extra');

const merge = require('lodash/merge');
const get = require('lodash/get');
const first = require('lodash/first');

const Log = require('../utils/log');
const { getProjects } = require('../api');

function prompt(config){

    let spinner = null;
    let result = null;

    const configPath = config.paths.config;

    const Errors = {
        TOKEN_INVALID: 'TOKEN_INVALID',
        TOKEN_ERROR: 'TOKEN_ERROR',
        TOKEN_NETWORK_ERROR: 'TOKEN_NETWORK_ERROR',
        WRITE_ERROR: 'WRITE_ERROR'
    }

    return inquirer.prompt([
        {
            type: 'password',
            name: 'token',
            message: 'API token',
            validate: (token) => {
                return !!token;
            }
        }
    ]).then(answers => {

        result = answers;

        spinner = ora('Checking token').start();

        return getProjects(merge(config, { token: answers.token })).catch(error => {

            const errors = get(error, 'response.errors');
            const firstError = errors ? first(errors) : null;

            if(firstError){

                if(firstError.code === 2030){
                    throw Errors.TOKEN_INVALID;
                }
                else {
                    throw Errors.TOKEN_ERROR;
                }
            }

            throw Errors.TOKEN_NETWORK_ERROR;
        });

    }).then(() => {

        spinner.stop();

        return fs.writeFile(configPath, JSON.stringify(result)).catch(error => {

            console.error(error);
            throw Errors.WRITE_ERROR;
        });

    }).then(() => {

        Log.success('Successfully configured Stringify CLI');

    }).catch(error => {

        spinner.stop();

        if(error === Errors.TOKEN_INVALID){

            Log.error('Invalid API token');
            return prompt(config);
        }
        else if(error === Errors.TOKEN_ERROR){
            Log.error('Couldn\'t validate your token due to a server problem, please try again later');
        }
        else if(error === Errors.TOKEN_NETWORK_ERROR){
            Log.error('Couldn\'t validate your token, please check your internet connection and try again');
        }
        else if(error === Errors.WRITE_ERROR){
            Log.error('Couldn\'t write configuration file');
        }
    });
}

module.exports = function(config){

    console.log("");
    console.log(chalk.bold.blue('Configuration'))
    console.log(
        "In order to use the Stringify CLI, you need to enter your API token.\n" +
        "You can get your token by following the next steps:\n"
    );

    console.log(
        "  1. Open Stringify in your browser\n" +
        "  2. Navigate to settings\n" +
        "  3. Generate an API-token by clicking the button (if not generated already)\n" +
        "  4. Click the 'Copy' button and paste your token below\n"
    )

    return prompt(config);
};