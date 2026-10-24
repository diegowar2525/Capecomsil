import { crearCatalogoApi } from '../../../services/catalogo.api.js';
import { requestJson } from '../../../services/http.js';

export const api = {
    ...crearCatalogoApi('/api/gasolineras'),
    relacionados: async (action, id, signal) => action === 'modalities'
        ? { modalidades: await requestJson(`/api/modalidades-tarifa?id_gasolinera=${id}`, { signal }) } : null,
    ejecutar: (action, id, values) => {
        if (action !== 'change-modality') throw new Error('Acción no admitida.');
        return requestJson('/api/modalidades-tarifa', { method: 'POST',
            data: { id_gasolinera: id, modalidad: values.modalidad, fecha_inicio: values.fecha_inicio } });
    }
};
