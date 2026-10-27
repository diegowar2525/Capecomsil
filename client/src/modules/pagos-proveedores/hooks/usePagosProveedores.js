import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/pagos-proveedores.api.js';
import { page } from '../pagos-proveedores.config.js';
export const usePagosProveedores = () => useCatalogo(api, page.rowKey);
