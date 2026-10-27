import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/modalidades-tarifa.api.js';
import { page } from '../modalidades-tarifa.config.js';
export const useModalidadesTarifa = () => useCatalogo(api, page.rowKey);
