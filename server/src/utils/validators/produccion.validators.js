const { validateFiltros } = require('./informe.validators');
const { validateId } = require('./common.validators');
const validateConsulta = (query = {}) => {
    const { id_terminal, ...rest } = query;
    return { ...validateFiltros(rest), id_terminal: id_terminal === undefined ? null : validateId(id_terminal) };
};
module.exports = { validateConsulta };
