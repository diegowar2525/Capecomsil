const { translateTarifaError } = require("./tarifa.errors");
const { translateProductoError } = require("./producto.errors");

const translators = [
    translateTarifaError,
    translateProductoError
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
