const informeModel = require("../models/informe.model");
const { validateFiltros } = require("../utils/validators/informe.validators");

const getViajes = async (query) => {
    return informeModel.viajes(validateFiltros(query));
};

const getResumen = async (query) => {
    const filtros = validateFiltros(query);
    return {
        fecha_desde: filtros.fecha_desde,
        fecha_hasta: filtros.fecha_hasta,
        id_vehiculo: filtros.id_vehiculo,
        ...(await informeModel.resumen(filtros))
    };
};

const getViaticos = async (query) => {
    return informeModel.viaticos(validateFiltros(query, true));
};

const getCombustible = async (query) => {
    return informeModel.combustible(validateFiltros(query));
};

module.exports = {
    getViajes,
    getResumen,
    getViaticos,
    getCombustible
};
