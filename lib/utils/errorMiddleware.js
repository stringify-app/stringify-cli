const handleApiError = require('./handleApiError');

module.exports = function(res){

    if(res.ok){
        return res;
    }

    return res.json()
        .catch(() => handleApiError(null))
        .then(handleApiError);
}