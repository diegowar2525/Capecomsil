import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/facturas-proveedores.api.js';
import { page } from '../facturas-proveedores.config.js';
export const useFacturasProveedores = () => useCatalogo(api, page.rowKey);
