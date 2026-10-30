const multer = require("multer");
const config = require("../config/auth");
const { MAX_BYTES } = require("../utils/validators/foto.validators");
const { createHttpError } = require("../utils/errors/http.error");

const upload = multer({ storage: multer.memoryStorage(), limits: {
    fileSize: MAX_BYTES, files: 1, fields: 0, parts: 1
} }).single("foto");

const recibirFoto = (req, res, next) => {
    const origin = req.get("Origin");
    if (req.auth.usuario.requiere_cambio_password) {
        return next(createHttpError("Debe cambiar su contraseña antes de continuar", 403));
    }
    if ((origin && !config.origins.includes(origin)) || req.get("X-CSRF-Protection") !== "1"
        || !req.is("multipart/form-data")) {
        return next(createHttpError("Petición no autorizada por protección CSRF", 403));
    }
    upload(req, res, error => {
        if (error) {
            return next(createHttpError(error.code === "LIMIT_FILE_SIZE"
                ? "La foto no puede superar 3 MB" : "Envíe únicamente un archivo en el campo foto",
            error.code === "LIMIT_FILE_SIZE" ? 413 : 400));
        }
        next();
    });
};

module.exports = { recibirFoto };
