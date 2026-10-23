const { createHttpError } = require("../errors/http.error");

const validateObject = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw createHttpError("Los datos de autenticación son obligatorios", 400);
    }
};

const validateNombreUsuario = (value) => {
    if (typeof value !== "string" || !/^[a-z0-9][a-z0-9._-]{2,49}$/.test(value.trim().toLowerCase())) {
        throw createHttpError("Nombre de usuario inválido", 400);
    }
    return value.trim().toLowerCase();
};

const validatePassword = (value, nueva = false) => {
    if (typeof value !== "string" || [...value].length < (nueva ? 10 : 1)
        || [...value].length > 128 || Buffer.byteLength(value, "utf8") > 512) {
        throw createHttpError(nueva ? "La contraseña debe tener entre 10 y 128 caracteres" : "Contraseña inválida", 400);
    }
    return value;
};

const validateLogin = (data) => {
    validateObject(data);
    return { nombre_usuario: validateNombreUsuario(data.nombre_usuario), password: validatePassword(data.password) };
};

const validateCambioPassword = (data) => {
    validateObject(data);
    const actual = validatePassword(data.password_actual);
    const nueva = validatePassword(data.password_nueva, true);
    if (actual === nueva) {
        throw createHttpError("La contraseña nueva debe ser diferente", 400);
    }
    return { actual, nueva };
};

const validatePrimerJefe = (data) => {
    validateObject(data);
    if (typeof data.nombre !== "string" || !data.nombre.trim() || data.nombre.trim().length > 150) {
        throw createHttpError("El nombre es obligatorio y admite máximo 150 caracteres", 400);
    }
    return {
        nombre_usuario: validateNombreUsuario(data.nombre_usuario),
        nombre: data.nombre.trim(),
        password: validatePassword(data.password, true)
    };
};

module.exports = {
    validateNombreUsuario,
    validatePassword,
    validateLogin,
    validateCambioPassword,
    validatePrimerJefe
};
