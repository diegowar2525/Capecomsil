const { createHttpError } = require("../errors/http.error");
const { validateOptionalText } = require("./common.validators");

const validateMotivo = (data) => {
    const motivo = validateOptionalText(data?.motivo, "motivo", 150);
    if (!motivo) {
        throw createHttpError("El motivo es obligatorio", 400);
    }
    return motivo;
};

module.exports = {
    validateMotivo
};
