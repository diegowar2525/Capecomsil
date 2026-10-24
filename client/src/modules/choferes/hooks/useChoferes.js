import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/choferes.api.js';

export function useChoferes() {
    return useCatalogo(api, 'id_chofer');
}
