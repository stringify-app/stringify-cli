const first = require('lodash/first');

const ApiError = require('../errors/ApiError')

module.exports = function(e){

    let apiError = null;

    if(e && e.error){
        apiError = e.error.error || e.error
    }
    else if(e && e.errors){
        apiError = first(e.errors);
    }

    if(apiError && apiError.message){

        const code = apiError.code;

        if(code === 400 || code === 2030){
            throw new ApiError('Your API token has expired or is invalid. Please run "stringify config".', apiError)
        }

        throw new ApiError(`${apiError.message} (${apiError.code})`, apiError);
    }
    else {

        if(e) {
            console.log("\n");
            console.log(e);
        }

        throw new Error('Invalid server response, please try again later.');
    }
};