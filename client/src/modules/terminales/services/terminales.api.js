import { crearCatalogoApi } from '../../../services/catalogo.api.js';

import { cargarOpciones } from '../../../services/consultas.api.js';

export const api = {
    opciones: signal => cargarOpciones({id_provincia: ['/api/provincias', 'id_provincia', 'nombre'], id_ciudad: ['/api/ciudades', 'id_ciudad', 'nombre']}, signal),
    ...crearCatalogoApi('/api/terminales')
};
