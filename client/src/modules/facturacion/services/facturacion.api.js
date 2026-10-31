import { crearCatalogoApi } from '../../../services/catalogo.api.js';
import { requestJson } from '../../../services/http.js';
import { listarPaginas } from '../../../services/consultas.api.js';
const path = '/api/facturas-cliente';
export const api = {
    ...crearCatalogoApi(path),
    listar: signal => listarPaginas(path, {}, signal),
    opciones: async signal => {
        const [liquidaciones, facturas] = await Promise.all([
            listarPaginas('/api/liquidaciones', { estado: 'CONFIRMADA' }, signal),
            listarPaginas(path, { estado: 'REGISTRADA' }, signal)
        ]);
        const ocupadas = new Set(facturas.map(row => row.id_liquidacion));
        return { id_liquidacion: liquidaciones.map(row => ({ value: String(row.id_liquidacion),
            label: `Liquidación ${row.id_liquidacion} · ${row.nombre_gasolinera} · ${row.periodo_inicio} al ${row.periodo_fin} · $${row.total_liquidacion}${ocupadas.has(row.id_liquidacion) ? ' (ya facturada)' : ''}`,
            disabled: ocupadas.has(row.id_liquidacion), registro: row })) };
    },
    ejecutar: (action, id, data) => {
        if (action === 'collect') return requestJson('/api/cobros-cliente', { method: 'POST', data: { ...data, id_factura: id } });
        if (action === 'annul') return requestJson(`${path}/${id}/anular`, { method: 'POST', data });
        throw new Error('Acción no admitida.');
    }
};
