const chalk = require('chalk');
const logSymbols = require('log-symbols');

const log = console.log;

function create(style, prefix=''){

    return function(message) {

        const fullMessage = (prefix + ' ' + message).trim();
        log(style(fullMessage))
    }
}

function getProjectIdentifier(project){

    return project.name || `Project ${project.id}`;
}

function getLocalizationPrefix(project, localization){

    return chalk.bold.white(getProjectIdentifier(project)) + ' ' + chalk.bold.green(localization.locale) + chalk.white(':');
}

module.exports = {
    error: create(chalk.red, logSymbols.error),
    success: create(chalk.green, logSymbols.success),
    info: create(chalk.blue, '>'),
    log: create(chalk.reset),
    getProjectIdentifier,
    getLocalizationPrefix
};