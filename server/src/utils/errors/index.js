const { translateTarifaError } = require("./tarifa.errors");
const { translateProductoError } = require("./producto.errors");
const { translateFacturaProveedorError } = require("./factura_proveedor.errors");

const translators = [
    translateTarifaError,
    translateProductoError,
    translateFacturaProveedorError
];

const translateDatabaseError = (error) => {
    for (const translateError of translators) {
        const translatedError = translateError(error);

        if (translatedError) {
            return translatedError;
        }
    }

    return null;
};

module.exports = {
    translateDatabaseError
};
