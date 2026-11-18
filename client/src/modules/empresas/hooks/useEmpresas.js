import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/empresas.api.js';

export function useEmpresas() {
    return useCatalogo(api, 'id_empresa');
}
