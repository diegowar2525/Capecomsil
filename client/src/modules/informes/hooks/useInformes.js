import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/informes.api.js';
import { page } from '../informes.config.js';
export const useInformes = () => useCatalogo(api, page.rowKey);
