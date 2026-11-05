const { createHttpError } = require('../errors/http.error');

const validateMes = (query = {}) => {
    if (Object.keys(query).some(key => key !== 'mes') || typeof query.mes !== 'string' || !/^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(query.mes)) {
        throw createHttpError('Selecciona un mes válido (AAAA-MM, entre 1900 y 2199)', 400);
    }
    const [year, month] = query.mes.split('-').map(Number);
    const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return { fecha_desde: `${query.mes}-01`, fecha_hasta: `${query.mes}-${last}` };
};

const validateCuentas = (query = {}) => {
    if (Object.keys(query).length) {
        throw createHttpError('Las cuentas por cobrar muestran el saldo actual acumulado, sin filtro de mes', 400);
    }
};
module.exports = { validateMes, validateCuentas };
