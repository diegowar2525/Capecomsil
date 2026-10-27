import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/configuraciones-viatico.api.js';
import { page } from '../configuraciones-viatico.config.js';
export const useConfiguracionesViatico = () => useCatalogo(api, page.rowKey);
