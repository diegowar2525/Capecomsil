import { crearCatalogoApi } from '../../../services/catalogo.api.js';

export const api = {
    ...crearCatalogoApi('/api/categorias-producto')
};
