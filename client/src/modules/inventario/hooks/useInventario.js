import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/inventario.api.js';
import { page } from '../inventario.config.js';
export const useInventario = () => useCatalogo(api, page.rowKey);
