const packageInfo = require('../package.json');
const program = require('commander');

const initCommand = require('./commands/init');
const configureCommand = require('./commands/configure');
const pullCommand = require('./commands/pull');
const pushCommand = require('./commands/push');
const syncCommand = require('./commands/sync');

module.exports = function(config){

    program
        .name('stringify')
        .version(packageInfo.version)
        .option('-f, --force', 'force operation');

    program
        .command('config')
        .description('configure Stringify')
        .action(() => configureCommand(config, program));

    program
        .command('init')
        .description('initialize project')
        .action(() => initCommand(config, program));

    program
        .command('sync')
        .description('sync locale files (push & pull)')
        .action(() => syncCommand(config, program));

    program
        .command('pull')
        .description('download locale files')
        .action(() => pullCommand(config, program));

    program
        .command('push')
        .description('upload locale files')
        .action(() => pushCommand(config, program));

    return program;
};