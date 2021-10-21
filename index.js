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

const baseConfig = Object.assign({ paths }, globalConfig);

const getUserConfiguration = async (path) => {
  if (!!process.env.STRINGIFY_API_TOKEN) {
    return {
      token: process.env.STRINGIFY_API_TOKEN.trim(),
    }
  }
  
  return JSON.parse(await fs.readFile(paths.config, 'utf8'));
}

async function start(){

    try {

        if (!process.env.STRINGIFY_API_TOKEN && !fs.existsSync(paths.config)) {
            await configureCommand(baseConfig);
        }

        const userConfig = await getUserConfiguration(paths.config);
        const config = Object.assign(baseConfig, userConfig);

        const program = createProgram(config);
        const result = await program.parseAsync(process.argv);

        if (!result.length) {
            program.outputHelp();
        }
    }
    catch(e){

        Log.error(e);
        process.exitCode = 1;
    }
}

start();
