import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/feriados.api.js';
import { page } from '../feriados.config.js';
export const useFeriados = () => useCatalogo(api, page.rowKey);
