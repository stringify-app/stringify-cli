const packageInfo = require('../package.json');
const program = require('commander');

const initCommand = require('./commands/init');
const configureCommand = require('./commands/configure');
const pullCommand = require('./commands/pull');
const pushCommand = require('./commands/push');

module.exports = function(config){

    program
        .name('stringify')
        .version(packageInfo.version);

    program
        .command('config')
        .description('configure Stringify')
        .action(() => configureCommand(config.paths.config));

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

    return program;
};