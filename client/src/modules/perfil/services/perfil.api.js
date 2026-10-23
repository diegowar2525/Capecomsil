// Solo datos del usuario autenticado; la identidad nunca se envía desde el formulario.
async function requestPerfil(method, { signal, data } = {}) {
    const response = await fetch('/api/auth/me', {
        method, credentials: 'include', cache: 'no-store', signal,
        ...(data ? { headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' }, body: JSON.stringify(data) } : {})
    });
    const json = await response.json().catch(() => null);
    if (!response.ok || !json) {
        const error = new Error(response.status === 401 ? 'No hay una sesión activa. Inicia sesión para consultar tu perfil.'
            : json?.message ?? 'No se pudo consultar el servidor. Inténtalo de nuevo.');
        error.status = response.status;
        throw error;
    }
    return json;
}

export async function consultarPerfil(signal) {
    const session = await requestPerfil('GET', { signal });
    if (!session.usuario?.id_usuario) throw new Error('El servidor no devolvió un perfil válido.');
    return session.usuario;
}

export async function actualizarPerfil(data) {
    const usuario = await requestPerfil('PATCH', { data });
    if (!usuario.id_usuario) throw new Error('El servidor no devolvió el perfil actualizado.');
    return usuario;
}
