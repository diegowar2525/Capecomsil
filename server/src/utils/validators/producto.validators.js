const { validateImagenUrl } = require("./common.validators");
const { validateId } = require("./common.validators");

const validateData = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        const error = new Error("Los datos del producto son obligatorios");
        error.status = 400;
        throw error;
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
        typeof nombre !== "string" || !nombre.trim() ||
        typeof unidad_medida !== "string" || !unidad_medida.trim()
    ) {
        const error = new Error("Nombre y unidad de medida son obligatorios");
        error.status = 400;
        throw error;
    }

    const camposTexto = { nombre, medida, modelo, marca, descripcion, unidad_medida };
    const limites = { nombre: 150, medida: 50, modelo: 100, marca: 100, unidad_medida: 30 };

    for (const [campo, valor] of Object.entries(camposTexto)) {
        if (valor !== undefined && valor !== null) {
            if (typeof valor !== "string") {
                const error = new Error(`El campo ${campo} debe ser texto`);
                error.status = 400;
                throw error;
            }

            if (limites[campo] && [...valor.trim()].length > limites[campo]) {
                const error = new Error(`El campo ${campo} admite máximo ${limites[campo]} caracteres`);
                error.status = 400;
                throw error;
            }
        }
    }

    if (
        !["string", "number"].includes(typeof stock_minimo) ||
        !/^\d{1,10}(\.\d{1,2})?$/.test(String(stock_minimo))
    ) {
        const error = new Error("El stock mínimo debe ser no negativo, con máximo 10 enteros y 2 decimales");
        error.status = 400;
        throw error;
    }

    if (estado !== undefined && typeof estado !== "boolean") {
        const error = new Error("El estado debe ser true o false");
        error.status = 400;
        throw error;
    }

    return {
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
