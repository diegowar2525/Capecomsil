const { validateOptionalText } = require("./common.validators");

const validateMotivo = (data) => {
    const motivo = validateOptionalText(data?.motivo, "motivo", 150);
    if (!motivo) {
        const error = new Error("El motivo es obligatorio");
        error.status = 400;
        throw error;
    }
    return motivo;
};

module.exports = { validateMotivo };
