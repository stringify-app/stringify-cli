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
        .version(packageInfo.version);

    program
        .command('config')
        .description('configure Stringify')
        .action(() => configureCommand(config));

    program
        .command('init')
        .description('initialize project')
        .action(() => initCommand(config));

    program
        .command('pull')
        .description('download string files')
        .action(() => pullCommand(config));

    program
        .command('push')
        .description('upload string files')
        .action(() => pushCommand(config));

    program
        .command('sync')
        .description('sync string files')
        .action(() => syncCommand(config));

    return program;
};