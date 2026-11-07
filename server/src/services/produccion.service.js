const model = require('../models/produccion.model');
const { validateConsulta } = require('../utils/validators/produccion.validators');
const findAll = query => model.findAll(validateConsulta(query));
module.exports = { findAll };
