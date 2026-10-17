const { translateRemuneracionError } = require("./remuneracion.errors");
const { translateTarifaError } = require("./tarifa.errors");
const { translateViajeError } = require("./viaje.errors");
const { translateProductoError } = require("./producto.errors");
const { translateFacturaProveedorError } = require("./factura_proveedor.errors");

const { translateTrayectoError } = require("./trayecto.errors");

const translators = [
    require("./gasto.errors").translateGastoError,
    require("./seguimiento_mantenimiento.errors").translateSeguimientoMantenimientoError,
    require("./costos_horarios.errors").translateCostosHorariosError,
    translateRemuneracionError,
    translateTrayectoError,
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
