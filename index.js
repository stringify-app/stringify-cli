#! /usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const createProgram = require('./lib/program');

const configureCommand = require( "./lib/commands/configure");
const globalConfig = require('./config');

const Log = require('./lib/utils/log');

const paths = {
    script: __dirname,
    project: process.cwd(),
    config: path.join(os.homedir(), globalConfig.userConfigFile)
};

let initPromise = Promise.resolve();

if(!fs.existsSync(paths.config)){
    initPromise = configureCommand(paths.config);
}

let program = null;

initPromise.then(() => {

    return fs.readFile(paths.config, 'utf8');

}).then((configJson) => {

    const userConfig = JSON.parse(configJson);
    const config = Object.assign({ paths }, globalConfig, userConfig);

    program = createProgram(config);
    return program.parseAsync(process.argv);

}).then((result) => {

    if(!result.length){
        program.outputHelp();
    }

}).catch(e => {

    Log.error(e);
    process.exit();
});