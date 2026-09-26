const gasolineraModel = require("../models/gasolinera.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateData } = require("../utils/validators/gasolinera.validators");

const getGasolineras = async () => {
    return await gasolineraModel.findAll();
};

const getGasolineraById = async (id) => {
    validateId(id);

    const gasolinera = await gasolineraModel.findById(id);

    if (!gasolinera) {
        const error = new Error("Gasolinera no encontrada");
        error.status = 404;
        throw error;
    }

    return gasolinera;
};

const createGasolinera = async (data) => {
    validateData(data);

    const gasolineraData = {
        nombre: data.nombre.trim(),
        ruc: data.ruc.trim(),
        direccion: data.direccion ?? null,
        telefono: data.telefono ?? null,
        correo: data.correo ?? null,
        representante_legal: data.representante_legal ?? null,
        agente_retencion: data.agente_retencion ?? false,
        estado: data.estado ?? true
    };

    return await gasolineraModel.create(gasolineraData);
};

const updateGasolinera = async (id, data) => {
    validateId(id);
    validateData(data);

    const existingGasolinera = await gasolineraModel.findById(id);

    if (!existingGasolinera) {
        const error = new Error("Gasolinera no encontrada");
        error.status = 404;
        throw error;
    }

    const gasolineraData = {
        nombre: data.nombre.trim(),
        ruc: data.ruc.trim(),
        direccion: data.direccion ?? null,
        telefono: data.telefono ?? null,
        correo: data.correo ?? null,
        representante_legal: data.representante_legal ?? null,
        agente_retencion: data.agente_retencion ?? false,
        estado: data.estado ?? true
    };

    return await gasolineraModel.update(id, gasolineraData);
};

const deleteGasolinera = async (id) => {
    validateId(id);

    const gasolinera = await gasolineraModel.findById(id);

    if (!gasolinera) {
        const error = new Error("Gasolinera no encontrada");
        error.status = 404;
        throw error;
    }

    return await gasolineraModel.remove(id);
};

module.exports = {
    getGasolineras,
    getGasolineraById,
    createGasolinera,
    updateGasolinera,
    deleteGasolinera
};