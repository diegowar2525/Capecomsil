import { crearCatalogoApi } from '../../../services/catalogo.api.js';
import { requestJson } from '../../../services/http.js';

export const api = {
    ...crearCatalogoApi('/api/proveedores'),
    relacionados: async (action, id, signal) => action === 'cuentas'
        ? { cuentas_por_pagar: await requestJson(`/api/proveedores/${id}/cuentas-por-pagar`, { signal }) } : null
};
