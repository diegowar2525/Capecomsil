import { crearCatalogoApi } from '../../../services/catalogo.api.js';
import { requestJson } from '../../../services/http.js';
import { listarPaginas } from '../../../services/consultas.api.js';
const path = '/api/facturas-cliente';
export const api = {
    ...crearCatalogoApi(path),
    listar: signal => listarPaginas(path, {}, signal),
    opciones: async signal => {
        const [liquidaciones, facturas, empresas] = await Promise.all([
            listarPaginas('/api/liquidaciones', { estado: 'CONFIRMADA' }, signal),
            listarPaginas(path, { estado: 'REGISTRADA' }, signal),
            requestJson('/api/empresas', { signal })
        ]);
        const ocupadas = new Set(facturas.flatMap(row => row.id_liquidaciones).map(String));
        return { id_empresa: empresas.filter(row => row.estado).map(row => ({ value: String(row.id_empresa), label: row.nombre, registro: row })),
            id_liquidaciones: liquidaciones.map(row => ({ value: String(row.id_liquidacion),
            label: `Liquidación ${row.id_liquidacion} · ${row.nombre_gasolinera} · ${row.periodo_inicio} al ${row.periodo_fin} · $${row.total_liquidacion}${ocupadas.has(String(row.id_liquidacion)) ? ' (ya facturada)' : ''}`,
            disabled: ocupadas.has(String(row.id_liquidacion)), registro: row })) };
    },
    ejecutar: (action, id, data) => {
        if (action === 'collect') return requestJson('/api/cobros-cliente', { method: 'POST', data: { ...data, id_factura: id } });
        if (action === 'annul') return requestJson(`${path}/${id}/anular`, { method: 'POST', data });
        throw new Error('Acción no admitida.');
    }
};
