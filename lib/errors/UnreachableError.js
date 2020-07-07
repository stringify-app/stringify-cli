class UnreachableError extends Error {

    constructor() {
        super('Unable to reach server, please check your internet connection and try again.');
    }
}

module.exports = UnreachableError