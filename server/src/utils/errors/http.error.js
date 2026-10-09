const createHttpError = (message, status = 409) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

module.exports = { createHttpError };
