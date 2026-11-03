const mantenimientosEdicionService = require('../services/mantenimientos_edicion.service');
const updateMantenimiento = async (req,res,next) => {
    try {
        const resultado = await mantenimientosEdicionService.updateMantenimiento(req.params.id,req.body,req.auth.usuario.id_usuario);
        return res.status(200).json(resultado);
    } catch(error) { next(error); }
};
const getHistorial = async (req,res,next) => {
    try {
        const resultado = await mantenimientosEdicionService.getHistorial(req.params.id);
        return res.status(200).json(resultado);
    } catch(error) { next(error); }
};
module.exports={updateMantenimiento,getHistorial};
