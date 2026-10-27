import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/gastos.api.js';
import { page } from '../gastos.config.js';
export const useGastos = () => useCatalogo(api, page.rowKey);
