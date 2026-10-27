import { crearCatalogoApi } from '../../../services/catalogo.api.js';
import { cargarOpciones } from '../../../services/consultas.api.js';
const path = '/api/tarifas-capacidad';
export const api = {
    ...crearCatalogoApi(path),
    opciones: (signal) => cargarOpciones({"id_gasolinera": ["/api/gasolineras", "id_gasolinera", "nombre"]}, signal)

};
