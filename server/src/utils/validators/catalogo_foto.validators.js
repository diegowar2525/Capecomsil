const { createHttpError } = require("../errors/http.error");

const validateRecurso = (value) => {
    if (!["choferes", "vehiculos", "productos"].includes(value)) {
        throw createHttpError("Catálogo de fotos no encontrado", 404);
    }
    return value;
};

module.exports = { validateRecurso };
