import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/mantenimiento.api.js';
import { page } from '../mantenimiento.config.js';
export const useMantenimiento = () => useCatalogo(api, page.rowKey);
