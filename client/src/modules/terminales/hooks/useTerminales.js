import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/terminales.api.js';

export function useTerminales() {
    return useCatalogo(api, 'id_terminal');
}
