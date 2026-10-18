const model = require("../models/informe.model");
const { validateFiltros } = require("../utils/validators/informe.validators");

const getViajes = async query => model.viajes(validateFiltros(query));

const getResumen = async query => {
    const filtros = validateFiltros(query);
    return {
        fecha_desde: filtros.fecha_desde, fecha_hasta: filtros.fecha_hasta,
        id_vehiculo: filtros.id_vehiculo, ...await model.resumen(filtros)
    };
};
const getViaticos = async query => model.viaticos(validateFiltros(query, true));

const getCombustible = async query => model.combustible(validateFiltros(query));

module.exports = { 
    getViajes, 
    getResumen, 
    getViaticos, 
    getCombustible 
};
