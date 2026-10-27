import { crearCatalogoApi } from '../../../services/catalogo.api.js';
import { cargarOpciones } from '../../../services/consultas.api.js';
const path = '/api/modalidades-tarifa';
export const api = {
    ...crearCatalogoApi(path),
    opciones: (signal) => cargarOpciones({"id_gasolinera": ["/api/gasolineras", "id_gasolinera", "nombre"]}, signal)

};
api.consultar = async (id, signal) => (await api.listar(signal)).find(row => String(row.id_modalidad_tarifa) === String(id));
