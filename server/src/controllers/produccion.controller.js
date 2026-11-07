const service = require('../services/produccion.service');
const findAll = async (req, res, next) => {
    try { return res.status(200).json(await service.findAll(req.query)); }
    catch (error) { next(error); }
};
module.exports = { findAll };
