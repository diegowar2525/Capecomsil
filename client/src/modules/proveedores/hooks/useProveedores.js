import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/proveedores.api.js';

export function useProveedores() {
    return useCatalogo(api, 'id_proveedor');
}
