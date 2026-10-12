const { validateId, validateDecimal, validateOptionalText } = require("./common.validators");
const { createHttpError } = require("../errors/http.error");

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) throw createHttpError("Los datos del trayecto son obligatorios", 400);
    const nombre = validateOptionalText(data.nombre, "nombre", 150);
    if (!nombre) throw createHttpError("El nombre del trayecto es obligatorio", 400);
    const resultado = { nombre };
    for (const extremo of ["origen", "destino"]) {
        for (const tipo of ["terminal", "gasolinera"]) {
            const campo = `id_${tipo}_${extremo}`;
            resultado[campo] = data[campo] == null ? null : validateId(data[campo]);
        }
        if ((resultado[`id_terminal_${extremo}`] !== null) === (resultado[`id_gasolinera_${extremo}`] !== null)) {
            throw createHttpError(`Indique exactamente un terminal o una gasolinera como ${extremo}`, 400);
        }
    }
    if (resultado.id_terminal_origen === resultado.id_terminal_destino && resultado.id_gasolinera_origen === resultado.id_gasolinera_destino) {
        throw createHttpError("Origen y destino deben ser distintos", 400);
    }
    resultado.kilometros = validateDecimal(data.kilometros, "kilometros", 8, 2);
    if (/^0+(\.0+)?$/.test(resultado.kilometros)) throw createHttpError("Los kilómetros deben ser mayores que cero", 400);
    if (data.estado !== undefined && typeof data.estado !== "boolean") throw createHttpError("estado debe ser true o false", 400);
    resultado.estado = data.estado ?? true;
    resultado.observacion = validateOptionalText(data.observacion, "observacion");
    return resultado;
};

module.exports = { validateData };
