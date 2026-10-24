import { crearCatalogoApi } from '../../../services/catalogo.api.js';
import { requestJson } from '../../../services/http.js';

export const api = {
    ...crearCatalogoApi('/api/trayectos'),
    opciones: async (signal) => {
        const [terminales, gasolineras] = await Promise.all([
            requestJson('/api/terminales', { signal }), requestJson('/api/gasolineras', { signal })
        ]);
        const opciones = (rows, key) => rows.map((row) => ({ value: String(row[key]), label: row.nombre + (row.estado ? '' : ' (inactivo)') }));
        return {
            id_terminal_origen: opciones(terminales, 'id_terminal'),
            id_terminal_destino: opciones(terminales, 'id_terminal'),
            id_gasolinera_origen: opciones(gasolineras, 'id_gasolinera'),
            id_gasolinera_destino: opciones(gasolineras, 'id_gasolinera')
        };
    }
};
