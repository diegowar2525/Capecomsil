const { validateId, validateDate, validateDateTime, validateDecimal } = require("./common.validators");
const { validateTramos } = require("./tramo_viaje.validators");
const { createHttpError } = require("../errors/http.error");

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) throw createHttpError("Los datos del viaje son obligatorios", 400);
    const fecha_inicio = validateDateTime(data.fecha_inicio);
    const fecha_fin = validateDateTime(data.fecha_fin);
    if (fecha_fin < fecha_inicio) throw createHttpError("La fecha de fin no puede ser anterior al inicio", 400);
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
    const tramos = validateTramos(data.tramos, detalles);
    return { fecha_inicio, fecha_fin, id_vehiculo, id_chofer, detalles, tramos };
};

const validateFiltros = (query) => {
    const filtros = {};
    for (const key of ["id_vehiculo", "id_chofer", "id_gasolinera", "id_terminal"]) {
        filtros[key] = query[key] === undefined ? null : validateId(query[key]);
    }
    filtros.fecha_desde = query.fecha_desde === undefined ? null : validateDate(query.fecha_desde);
    filtros.fecha_hasta = query.fecha_hasta === undefined ? null : validateDate(query.fecha_hasta);
    filtros.estado = query.estado ?? null;
    if (filtros.fecha_desde && filtros.fecha_hasta && filtros.fecha_desde > filtros.fecha_hasta) throw createHttpError("Rango de fechas inválido", 400);
    if (filtros.estado !== null && !["REGISTRADO", "ANULADO"].includes(filtros.estado)) throw createHttpError("Estado de viaje inválido", 400);
    filtros.limit = query.limit === undefined ? 50 : validateId(query.limit);
    filtros.offset = query.offset === undefined ? 0 : Number(query.offset);
    if (filtros.limit > 200 || (query.offset !== undefined && (typeof query.offset !== "string" || !/^\d+$/.test(query.offset)))
        || !Number.isSafeInteger(filtros.offset) || filtros.offset < 0 || filtros.offset > 2147483647) {
        throw createHttpError("limit debe estar entre 1 y 200 y offset debe ser un entero no negativo", 400);
    }
    return filtros;
};

module.exports = { validateData, validateFiltros };
