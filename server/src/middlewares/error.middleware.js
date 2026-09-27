const { translateDatabaseError } = require("../utils/errors");

const errorHandler = (error, req, res, next) => {
    console.error(error);

    if (res.headersSent) {
        return next(error);
    }

    const translatedError = translateDatabaseError(error);
    const status = error.status || translatedError?.status || 500;
    let message = "Error interno del servidor";

    if (error.status && status < 500) {
        message = error.message;
    } else if (translatedError) {
        message = translatedError.message;
    }

    res.status(status).json({
        message
    });
};

module.exports = errorHandler;
