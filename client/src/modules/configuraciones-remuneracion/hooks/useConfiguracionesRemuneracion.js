import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/configuraciones-remuneracion.api.js';
import { page } from '../configuraciones-remuneracion.config.js';
export const useConfiguracionesRemuneracion = () => useCatalogo(api, page.rowKey);
