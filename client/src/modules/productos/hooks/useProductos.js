import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/productos.api.js';

export function useProductos() {
    return useCatalogo(api, 'id_producto_transportado');
}
