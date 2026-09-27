const { translateTarifaError } = require("./tarifa.errors");

const translators = [
    translateTarifaError
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
