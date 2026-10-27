import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/planes-mantenimiento.api.js';
import { page } from '../planes-mantenimiento.config.js';
export const usePlanesMantenimiento = () => useCatalogo(api, page.rowKey);
