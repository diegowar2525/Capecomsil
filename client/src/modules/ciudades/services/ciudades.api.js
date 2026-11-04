import { crearCatalogoApi } from '../../../services/catalogo.api.js';

import { cargarOpciones } from '../../../services/consultas.api.js';

export const api = {
    opciones: signal => cargarOpciones({id_provincia: ['/api/provincias', 'id_provincia', 'nombre']}, signal),
    ...crearCatalogoApi('/api/ciudades')
};
