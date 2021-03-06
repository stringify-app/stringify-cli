const pullCommand = require('./pull');
const pushCommand = require('./push');

module.exports = async function(config, program){

    const pushSuccess = await pushCommand(config, program);

    if(pushSuccess){

        console.log("");
        await pullCommand(config, program);
    }
}