module.exports = function(e){

    const apiError = e.error ? e.error.error : null;

    if(apiError && apiError.message){
        return new Error(`${apiError.message} (${apiError.code})`);
    }

    return e;
};