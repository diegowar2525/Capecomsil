import { requestJson } from '../../../services/http.js';

export async function consultarPerfil(signal) {
    const session = await requestJson('/api/auth/me', { signal });
    if (!session.usuario?.id_usuario) throw new Error('El servidor no devolvió un perfil válido.');
    return session.usuario;
}

export async function actualizarPerfil(data) {
    const usuario = await requestJson('/api/auth/me', { method: 'PATCH', data });
    if (!usuario.id_usuario) throw new Error('El servidor no devolvió el perfil actualizado.');
    return usuario;
}
