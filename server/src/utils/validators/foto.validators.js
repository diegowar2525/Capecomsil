const { createHttpError } = require("../errors/http.error");
const MAX_BYTES = 3 * 1024 * 1024;

const validateFoto = (data) => {
    if (!Buffer.isBuffer(data?.buffer) || !data.buffer.length) {
        throw createHttpError("Seleccione una foto", 400);
    }
    if (data.buffer.length > MAX_BYTES) {
        throw createHttpError("La foto no puede superar 3 MB", 413);
    }
    return data.buffer;
};

module.exports = { validateFoto, MAX_BYTES };
