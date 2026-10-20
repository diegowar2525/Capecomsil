const config = require("../config/auth");
const authService = require("../services/auth.service");
const { readToken } = require("../utils/session-cookie");
const { createHttpError } = require("../utils/errors/http.error");

const autenticar = async (req, res, next) => {
    try {
        req.auth = await authService.autenticar(readToken(req));
        next();
    } catch (error) {
        next(error);
    }
};

// Encabezado personalizado + JSON impiden peticiones simples cross-site.
// CORS solo permite orígenes explícitos; Origin se valida también en el servidor.
const protegerCsrf = (req, res, next) => {
    const origin = req.get("Origin");
    if ((origin && !config.origins.includes(origin))
        || req.get("X-CSRF-Protection") !== "1" || !req.is("application/json")) {
        return next(createHttpError("Petición de autenticación no autorizada", 403));
    }
    next();
};

module.exports = {
    autenticar,
    protegerCsrf
};
