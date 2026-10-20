const { translateDatabaseError } = require("../utils/errors");

const errorHandler = (error, req, res, next) => {
    // Los errores del parser JSON pueden contener el cuerpo con credenciales.
    // No registrar el objeto completo, mensajes con fragmentos de entrada ni SQL.
    console.error("Error de petición", {
        name: error.name,
        code: error.code,
        status: error.status || 500
    });

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
