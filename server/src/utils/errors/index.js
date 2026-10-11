const { translateTarifaError } = require("./tarifa.errors");
const { translateViajeError } = require("./viaje.errors");
const { translateProductoError } = require("./producto.errors");
const { translateFacturaProveedorError } = require("./factura_proveedor.errors");

const translators = [
    translateViajeError,
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
