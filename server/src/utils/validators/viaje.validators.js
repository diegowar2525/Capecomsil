const {
    validateId,
    validateDateTime,
    validateDate,
    validateDecimal
} = require("./common.validators");
const { validateTramos } = require("./tramo_viaje.validators");
const { createHttpError } = require("../errors/http.error");
const { validateMotivo } = require("./anulacion.validators");

const validateEdicion = (data) => {
    const resultado = validateData(data);
    const permitidos = ["fecha_inicio", "fecha_fin", "id_vehiculo", "id_chofer", "detalles", "tramos", "version", "motivo"];
    if (Object.keys(data).some((campo) => !permitidos.includes(campo))) {
        throw createHttpError("Campo de edición de viaje no admitido", 400);
    }
    const asignarIds = (originales, normalizados, campo, campos) => {
        const ids = new Set();
        originales.forEach((original, index) => {
            if (Object.keys(original).some((key) => !campos.includes(key))) {
                throw createHttpError("Campo de entrega o tramo no admitido", 400);
            }
            const id = original[campo] === undefined ? null : validateId(original[campo]);
            if (id !== null && ids.has(id)) {
                throw createHttpError("No repita IDs de entregas o tramos", 400);
            }
            ids.add(id);
            normalizados[index][campo] = id;
        });
    };
    asignarIds(data.detalles, resultado.detalles, "id_detalle_viaje",
        ["id_detalle_viaje", "id_gasolinera", "id_terminal", "id_producto_transportado", "galones"]);
    asignarIds([...data.tramos].sort((a, b) => a.orden - b.orden), resultado.tramos, "id_tramo_viaje",
        ["id_tramo_viaje", "id_trayecto", "orden", "observacion"]);
    return { ...resultado, version: validateId(data.version), motivo: validateMotivo(data) };
};

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw createHttpError("Los datos del viaje son obligatorios", 400);
    }
    if (data.fecha !== undefined) {
        throw createHttpError("Use fecha_inicio y fecha_fin con fecha y hora", 400);
    }
    const fecha_inicio = validateDateTime(data.fecha_inicio);
    const fecha_fin = validateDateTime(data.fecha_fin);
    if (data.fecha_inicio.length <= 10 || data.fecha_fin.length <= 10) {
        throw createHttpError("Indique la hora de inicio y fin", 400);
    }
    if (fecha_fin <= fecha_inicio || fecha_inicio.slice(0, 10) !== fecha_fin.slice(0, 10)) {
        throw createHttpError(
            "El viaje debe terminar después del inicio y dentro del mismo día",
            400
        );
    }
    const id_vehiculo = validateId(data.id_vehiculo);
    const id_chofer = validateId(data.id_chofer);
    if (!Array.isArray(data.detalles) || !data.detalles.length) {
        throw createHttpError("El viaje debe tener al menos una entrega", 400);
    }
    const combinaciones = new Set();
    const detalles = data.detalles.map((detalle) => {
        if (!detalle || typeof detalle !== "object" || Array.isArray(detalle)) {
            throw createHttpError("Detalle de viaje inválido", 400);
        }
        const id_gasolinera = validateId(detalle.id_gasolinera);
        const id_terminal = validateId(detalle.id_terminal);
        const id_producto_transportado = validateId(detalle.id_producto_transportado);
        const galones = validateDecimal(detalle.galones, "galones", 12, 2);
        if (/^0+(\.0+)?$/.test(galones)) {
            throw createHttpError("Los galones deben ser mayores que cero", 400);
        }
        const clave = `${id_gasolinera}:${id_terminal}:${id_producto_transportado}`;
        if (combinaciones.has(clave)) {
            throw createHttpError(
                "Hay entregas repetidas para la misma gasolinera, terminal y combustible",
                400
            );
        }
        combinaciones.add(clave);
        return {
            id_gasolinera,
            id_terminal,
            id_producto_transportado,
            galones
        };
    });
    const tramos = validateTramos(data.tramos, detalles);
    return {
        fecha_inicio,
        fecha_fin,
        id_vehiculo,
        id_chofer,
        detalles,
        tramos
    };
};

const validateFiltros = (query) => {
    const filtros = {};
    for (const key of ["id_vehiculo", "id_chofer", "id_gasolinera", "id_terminal"]) {
        filtros[key] = query[key] === undefined ? null : validateId(query[key]);
    }
    filtros.fecha_desde = query.fecha_desde === undefined ? null : validateDate(query.fecha_desde);
    filtros.fecha_hasta = query.fecha_hasta === undefined ? null : validateDate(query.fecha_hasta);
    filtros.estado = query.estado ?? null;
    if (filtros.fecha_desde && filtros.fecha_hasta && filtros.fecha_desde > filtros.fecha_hasta) {
        throw createHttpError("Rango de fechas inválido", 400);
    }
    if (filtros.estado !== null && !["REGISTRADO", "ANULADO"].includes(filtros.estado)) {
        throw createHttpError("Estado de viaje inválido", 400);
    }
    filtros.limit = query.limit === undefined ? 50 : validateId(query.limit);
    filtros.offset = query.offset === undefined ? 0 : Number(query.offset);
    if (
        filtros.limit > 200 ||
        (query.offset !== undefined &&
            (typeof query.offset !== "string" || !/^\d+$/.test(query.offset))) ||
        !Number.isSafeInteger(filtros.offset) ||
        filtros.offset < 0 ||
        filtros.offset > 2147483647
    ) {
        throw createHttpError(
            "limit debe estar entre 1 y 200 y offset debe ser un entero no negativo",
            400
        );
    }
    return filtros;
};

module.exports = {
    validateEdicion,
    validateData,
    validateFiltros
};
