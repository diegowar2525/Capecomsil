import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/provincias.api.js';

export function useProvincias() {
    return useCatalogo(api, 'id_provincia');
}
