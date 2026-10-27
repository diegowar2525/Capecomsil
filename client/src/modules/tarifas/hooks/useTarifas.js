import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/tarifas.api.js';
import { page } from '../tarifas.config.js';
export const useTarifas = () => useCatalogo(api, page.rowKey);
