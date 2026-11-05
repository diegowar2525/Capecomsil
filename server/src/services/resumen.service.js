const resumenModel = require('../models/resumen.model');
const { validateMes, validateCuentas } = require('../utils/validators/resumen.validators');

const getMensual = query => {
    const datosValidados = validateMes(query);
    return resumenModel.mensual(datosValidados);
};
const getCuentasPorCobrar = query => {
    validateCuentas(query);
    return resumenModel.cuentasPorCobrar();
};
module.exports = { getMensual, getCuentasPorCobrar };
