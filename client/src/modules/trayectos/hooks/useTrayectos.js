import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/trayectos.api.js';

export function useTrayectos() {
    return useCatalogo(api, 'id_trayecto');
}
