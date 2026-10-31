import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/pagos.api.js';
import { page } from '../pagos.config.js';
export const usePagos = () => useCatalogo(api, page.rowKey);
