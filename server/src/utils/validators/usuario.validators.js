const { validateId, validateImagenUrl, validateOptionalText } = require("./common.validators");
const { createHttpError } = require("../errors/http.error");
const { validateNombreUsuario, validatePassword } = require("./auth.validators");

const validateCampos = (data, campos) => {
    if (!data || typeof data !== "object" || Array.isArray(data)
        || Object.keys(data).some((campo) => !campos.includes(campo))) {
        throw createHttpError("Datos de usuario no admitidos", 400);
    }
};

const validateContacto = (data) => {
    const resultado = {};
    if (Object.hasOwn(data, "correo")) {
        const correo = validateOptionalText(data.correo, "correo", 254);
        if (correo !== null && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            throw createHttpError("Correo electrónico inválido", 400);
        }
        resultado.correo = correo;
    }
    if (Object.hasOwn(data, "imagen_url")) resultado.imagen_url = validateImagenUrl(data.imagen_url);
    return resultado;
};

const validatePerfil = (data) => {
    validateCampos(data, ["nombre", "correo", "imagen_url"]);
    if (!Object.keys(data).length) throw createHttpError("Indique al menos un campo del perfil", 400);
    const resultado = validateContacto(data);
    if (Object.hasOwn(data, "nombre")) {
        if (typeof data.nombre !== "string" || !data.nombre.trim() || data.nombre.trim().length > 150) {
            throw createHttpError("El nombre es obligatorio y admite máximo 150 caracteres", 400);
        }
        resultado.nombre = data.nombre.trim();
    }
    return resultado;
};

const validateEdicion = (data) => {
    validateCampos(data, ["nombre_usuario", "nombre", "id_rol", "correo", "imagen_url"]);
    if (typeof data.nombre !== "string" || !data.nombre.trim() || data.nombre.trim().length > 150) {
        throw createHttpError("El nombre es obligatorio y admite máximo 150 caracteres", 400);
    }
    return { ...validateContacto(data), nombre_usuario: validateNombreUsuario(data.nombre_usuario), nombre: data.nombre.trim(), id_rol: validateId(data.id_rol) };
};

const validateCreacion = (data) => {
    validateCampos(data, ["nombre_usuario", "nombre", "id_rol", "password_temporal", "correo", "imagen_url"]);
    const { password_temporal, ...perfil } = data;
    return { ...validateEdicion(perfil), password_temporal: validatePassword(password_temporal, true) };
};

const validateMotivo = (data, campos) => {
    validateCampos(data, campos);
    if (typeof data.motivo !== "string" || !data.motivo.trim() || data.motivo.trim().length > 500) {
        throw createHttpError("El motivo es obligatorio y admite máximo 500 caracteres", 400);
    }
    return data.motivo.trim();
};

const validateEstado = (data) => {
    const motivo = validateMotivo(data, ["activo", "motivo"]);
    if (typeof data.activo !== "boolean") {
        throw createHttpError("activo debe ser booleano", 400);
    }
    return { activo: data.activo, motivo };
};

const validateRestablecimiento = (data) => {
    const motivo = validateMotivo(data, ["password_temporal", "motivo"]);
    return { password_temporal: validatePassword(data.password_temporal, true), motivo };
};

const validateFiltros = (query = {}) => {
    if (!query || typeof query !== "object" || Array.isArray(query)) {
        throw createHttpError("Los filtros de usuarios deben ser un objeto", 400);
    }
    const permitidos = ["activo", "id_rol", "limit", "offset"];
    if (Object.keys(query).some((campo) => !permitidos.includes(campo))) {
        throw createHttpError("Filtro de usuarios no admitido", 400);
    }
    if (query.activo !== undefined && !["true", "false"].includes(query.activo)) {
        throw createHttpError("activo debe ser true o false", 400);
    }
    const limit = query.limit === undefined ? 50 : validateId(query.limit);
    const offset = query.offset === undefined ? 0 : Number(query.offset);
    if (
        limit > 200 || !Number.isSafeInteger(offset) || offset < 0 || offset > 2147483647 ||
        (query.offset !== undefined &&
            (typeof query.offset !== "string" || !/^\d+$/.test(query.offset)))
    ) {
        throw createHttpError("limit debe estar entre 1 y 200 y offset debe ser un entero no negativo", 400);
    }
    return {
        activo: query.activo === undefined ? null : query.activo === "true",
        id_rol: query.id_rol === undefined ? null : validateId(query.id_rol),
        limit,
        offset
    };
};

module.exports = {
    validatePerfil,
    validateCreacion,
    validateEdicion,
    validateEstado,
    validateRestablecimiento,
    validateFiltros
};
