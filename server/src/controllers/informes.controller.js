const service = require("../services/informes.service");

const getViajes = async (req, res, next) => {
    try {
        res.status(200).json(await service.getViajes(req.query));
    } catch (error) { next(error); }
};
const getResumen = async (req, res, next) => {
    try {
        res.status(200).json(await service.getResumen(req.query));
    } catch (error) { next(error); }
};
const getViaticos = async (req, res, next) => {
    try {
        res.status(200).json(await service.getViaticos(req.query));
    } catch (error) { next(error); }
};
const getCombustible = async (req, res, next) => {
    try {
        res.status(200).json(await service.getCombustible(req.query));
    } catch (error) { next(error); }
};

module.exports = { getViajes, getResumen, getViaticos, getCombustible };
