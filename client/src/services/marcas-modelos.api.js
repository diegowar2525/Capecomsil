import { crearCatalogoApi } from './catalogo.api.js';
import { requestJson } from './http.js';
export const marcasApi = crearCatalogoApi('/api/marcas');
export const modelosApi = crearCatalogoApi('/api/modelos');
export async function cargarMarcasModelos(ambito, signal) {
    const [marcas, modelos] = await Promise.all([
        requestJson(`/api/marcas?ambito=${ambito}`, {signal}),
        requestJson(`/api/modelos?ambito=${ambito}`, {signal})
    ]);
    const opciones = (rows, key) => rows.map(registro => ({value:String(registro[key]),label:registro.nombre,registro}));
    return {id_marca:opciones(marcas,'id_marca'),id_modelo:opciones(modelos,'id_modelo')};
}
