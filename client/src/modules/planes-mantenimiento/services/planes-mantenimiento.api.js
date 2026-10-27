import { crearCatalogoApi } from '../../../services/catalogo.api.js';
import { cargarOpciones } from '../../../services/consultas.api.js';
const path = '/api/planes-mantenimiento';
export const api = {
    ...crearCatalogoApi(path),
    opciones: (signal) => cargarOpciones({"id_vehiculo": ["/api/vehiculos", "id_vehiculo", "placa"]}, signal)

};
