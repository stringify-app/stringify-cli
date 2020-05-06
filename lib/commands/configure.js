const inquirer = require('inquirer');
const fs = require('fs-extra');

module.exports = function(path){

    return inquirer.prompt([
        {
            type: 'input',
            name: 'token',
            message: 'Stringify token (copy/paste from application)'
        }
    ]).then(answers => {

        return fs.writeFile(path, JSON.stringify(answers))
    });
};