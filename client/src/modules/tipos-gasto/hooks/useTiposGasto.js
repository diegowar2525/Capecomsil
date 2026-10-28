import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/tipos-gasto.api.js';
export const useTiposGasto = () => useCatalogo(api, 'id_tipo_gasto');
