import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/configuraciones-peaje-trayecto.api.js';
import { page } from '../configuraciones-peaje-trayecto.config.js';
export const useConfiguracionesPeaje = () => useCatalogo(api, page.rowKey);
