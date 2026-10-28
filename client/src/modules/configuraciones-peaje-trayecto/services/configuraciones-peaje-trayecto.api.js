import { crearCatalogoApi } from '../../../services/catalogo.api.js';
import { cargarOpciones } from '../../../services/consultas.api.js';
const path = '/api/configuraciones-peaje-trayecto';
export const api = {
    ...crearCatalogoApi(path),
    opciones: (signal) => cargarOpciones({"id_trayecto": ["/api/trayectos", "id_trayecto", "nombre"]}, signal)

};
