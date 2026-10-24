import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/productos-inventario.api.js';

export function useProductosInventario() {
    return useCatalogo(api, 'id_producto');
}
