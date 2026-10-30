import { requestJson } from './http.js';

export function crearFotoApi(ruta) {
    return {
        guardar: (id, archivo) => {
            const data = new FormData();
            data.append('foto', archivo);
            return requestJson(ruta(id), { method: 'PUT', data });
        },
        eliminar: (id) => requestJson(ruta(id), { method: 'DELETE' })
    };
}

export const fotoPerfilApi = crearFotoApi(() => '/api/auth/me/foto');
export const fotoChoferApi = crearFotoApi(id => `/api/fotos/choferes/${id}`);
export const fotoVehiculoApi = crearFotoApi(id => `/api/fotos/vehiculos/${id}`);
export const fotoProductoApi = crearFotoApi(id => `/api/fotos/productos/${id}`);
