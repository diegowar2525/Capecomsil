const { validateId, validateDate, validateDecimal } = require("./common.validators");
const { createHttpError } = require("../errors/http.error");

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) throw createHttpError("Los datos del viaje son obligatorios", 400);
    const fecha = validateDate(data.fecha);
    const id_vehiculo = validateId(data.id_vehiculo);
    const id_chofer = validateId(data.id_chofer);
    if (!Array.isArray(data.detalles) || !data.detalles.length) throw createHttpError("El viaje debe tener al menos una entrega", 400);
    const combinaciones = new Set();
    const detalles = data.detalles.map(detalle => {
        if (!detalle || typeof detalle !== "object" || Array.isArray(detalle)) throw createHttpError("Detalle de viaje inválido", 400);
        const id_gasolinera = validateId(detalle.id_gasolinera);
        const id_terminal = validateId(detalle.id_terminal);
        const id_producto_transportado = validateId(detalle.id_producto_transportado);
        const galones = validateDecimal(detalle.galones, "galones", 12, 2);
        if (/^0+(\.0+)?$/.test(galones)) throw createHttpError("Los galones deben ser mayores que cero", 400);
        const clave = `${id_gasolinera}:${id_terminal}:${id_producto_transportado}`;
        if (combinaciones.has(clave)) throw createHttpError("Hay entregas repetidas para la misma gasolinera, terminal y combustible", 400);
        combinaciones.add(clave);
        return { id_gasolinera, id_terminal, id_producto_transportado, galones };
    });
    return { fecha, id_vehiculo, id_chofer, detalles };
};

module.exports = { validateData };
