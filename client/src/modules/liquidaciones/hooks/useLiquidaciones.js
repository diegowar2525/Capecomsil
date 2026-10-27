import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/liquidaciones.api.js';
export const useLiquidaciones = () => useCatalogo(api, 'id_liquidacion');
