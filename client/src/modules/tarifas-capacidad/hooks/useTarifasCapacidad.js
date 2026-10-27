import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/tarifas-capacidad.api.js';
import { page } from '../tarifas-capacidad.config.js';
export const useTarifasCapacidad = () => useCatalogo(api, page.rowKey);
