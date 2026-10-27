import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/abastecimientos-combustible.api.js';
import { page } from '../abastecimientos-combustible.config.js';
export const useAbastecimientos = () => useCatalogo(api, page.rowKey);
