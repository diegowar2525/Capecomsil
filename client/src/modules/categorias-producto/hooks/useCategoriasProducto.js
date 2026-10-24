import { useCatalogo } from '../../../hooks/useCatalogo.js';
import { api } from '../services/categorias-producto.api.js';

export function useCategoriasProducto() {
    return useCatalogo(api, 'id_categoria');
}
