import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/configuraciones-combustible.api.js';
import { page } from '../configuraciones-combustible.config.js';
export const useConfiguracionesCombustible = () => useCatalogo(api, page.rowKey);
