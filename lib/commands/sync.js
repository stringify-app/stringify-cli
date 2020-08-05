const Log = require('../utils/log');

const pullCommand = require('./pull');
const pushCommand = require('./push');

module.exports = async function(config){

    const pushSuccess = await pushCommand(config);
    if(pushSuccess){
        await pullCommand(config);
    }
}