import { crearCatalogoApi } from '../../../services/catalogo.api.js';
import { requestJson } from '../../../services/http.js';
import { listarPaginas } from '../../../services/consultas.api.js';
const path = '/api/cobros-cliente';
export const api = {
    ...crearCatalogoApi(path),
    listar: signal => listarPaginas(path, {}, signal),
    opciones: async signal => ({ id_factura: (await listarPaginas('/api/facturas-cliente', {}, signal)).map(row => ({
        value: String(row.id_factura), label: `${row.numero_factura} · ${row.nombre_gasolinera} · Saldo $${row.saldo}${row.estado === 'ANULADA' ? ' (anulada)' : ''}`,
        disabled: row.estado === 'ANULADA' || Number(row.saldo) <= 0, registro: row
    })) }),
    ejecutar: (action, id, data) => {
        if (action !== 'annul') throw new Error('Acción no admitida.');
        return requestJson(`${path}/${id}/anular`, { method: 'POST', data });
    }
};
