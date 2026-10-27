import { requestJson } from '../../../services/http.js';

export async function consultarSesion(signal) {
    const session = await requestJson('/api/auth/me', { signal });
    if (!session.usuario?.id_usuario || !Array.isArray(session.permisos)) {
        throw new Error('El servidor no devolvió una sesión válida.');
    }
    return session;
}
