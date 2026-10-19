const { createHttpError } = require("../errors/http.error");
const { validateImagenUrl } = require("./common.validators");
const { validateId } = require("./common.validators");

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw createHttpError("Los datos del producto son obligatorios", 400);
    }
    const {
        id_categoria,
        nombre,
        medida,
        modelo,
        marca,
        descripcion,
        unidad_medida,
        stock_minimo = 0,
        estado
    } = data;
    const idCategoriaNumerico = validateId(id_categoria);
    if (
        typeof nombre !== "string" ||
        !nombre.trim() ||
        typeof unidad_medida !== "string" ||
        !unidad_medida.trim()
    ) {
        throw createHttpError("Nombre y unidad de medida son obligatorios", 400);
    }
    const camposTexto = {
        nombre,
        medida,
        modelo,
        marca,
        descripcion,
        unidad_medida
    };
    const limites = {
        nombre: 150,
        medida: 50,
        modelo: 100,
        marca: 100,
        unidad_medida: 30
    };
    for (const [campo, valor] of Object.entries(camposTexto)) {
        if (valor !== undefined && valor !== null) {
            if (typeof valor !== "string") {
                throw createHttpError(`El campo ${campo} debe ser texto`, 400);
            }
            if (limites[campo] && [...valor.trim()].length > limites[campo]) {
                throw createHttpError(
                    `El campo ${campo} admite máximo ${limites[campo]} caracteres`,
                    400
                );
            }
        }
    }
    if (
        !["string", "number"].includes(typeof stock_minimo) ||
        !/^\d{1,10}(\.\d{1,2})?$/.test(String(stock_minimo))
    ) {
        throw createHttpError(
            "El stock mínimo debe ser no negativo, con máximo 10 enteros y 2 decimales",
            400
        );
    }
    if (estado !== undefined && typeof estado !== "boolean") {
        throw createHttpError("El estado debe ser true o false", 400);
    }
    let condicion_llanta = data.condicion_llanta ?? null;
    if (condicion_llanta !== null) {
        if (
            typeof condicion_llanta !== "string" ||
            !["NUEVA", "REENCAUCHADA"].includes(condicion_llanta.trim().toUpperCase())
        ) {
            throw createHttpError("La condición de llanta debe ser NUEVA o REENCAUCHADA", 400);
        }
        condicion_llanta = condicion_llanta.trim().toUpperCase();
    }
    return {
        condicion_llanta,
        imagen_url: validateImagenUrl(data.imagen_url),
        id_categoria: idCategoriaNumerico,
        nombre: nombre.trim(),
        medida: medida?.trim() || null,
        modelo: modelo?.trim() || null,
        marca: marca?.trim() || null,
        descripcion: descripcion?.trim() || null,
        unidad_medida: unidad_medida.trim().toLowerCase(),
        stock_minimo: String(stock_minimo),
        estado: estado ?? true
    };
};

module.exports = {
    validateData
};
