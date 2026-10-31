import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/facturacion.api.js';
import { page } from '../facturacion.config.js';
export const useFacturacion = () => useCatalogo(api, page.rowKey);
