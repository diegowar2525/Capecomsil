const config = require("../config/auth");
const authService = require("../services/auth.service");
const { readToken } = require("../utils/session-cookie");
const { createHttpError } = require("../utils/errors/http.error");

const autenticar = async (req, res, next) => {
    res.set("Cache-Control", "no-store");
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
    // DELETE puede no tener cuerpo. Comprobar el tipo declarado, no su longitud.
    const contentType = req.get("Content-Type")?.split(";")[0].trim().toLowerCase();
    if ((origin && !config.origins.includes(origin))
        || req.get("X-CSRF-Protection") !== "1" || contentType !== "application/json") {
        return next(createHttpError("Petición no autorizada por protección CSRF", 403));
    }
    next();
};

const protegerOperacion = (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (!req.auth) {
        return next(createHttpError("Debe iniciar sesión", 401));
    }
    if (req.auth.usuario.requiere_cambio_password) {
        return next(createHttpError("Debe cambiar su contraseña antes de continuar", 403));
    }
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        return protegerCsrf(req, res, next);
    }
    next();
};

const exigirPermiso = (codigo) => {
    if (typeof codigo !== "string" || !/^[a-z_]+\.[a-z_]+$/.test(codigo)) {
        throw new Error("Se requiere un código de permiso explícito");
    }
    const autorizar = (req, res, next) => {
        if (!req.auth) {
            return next(createHttpError("Debe iniciar sesión", 401));
        }
        if (!req.auth.permisos.includes(codigo)) {
            return next(createHttpError("No tiene permiso para realizar esta operación", 403));
        }
        next();
    };
    // Permite auditar que cada ruta declare su autorización.
    autorizar.permiso = codigo;
    return autorizar;
};

module.exports = {
    autenticar,
    protegerCsrf,
    protegerOperacion,
    exigirPermiso
};
