export async function requestJson(path, { method = 'GET', data, signal } = {}) {
    let response;
    try {
        response = await fetch(path, {
            method, credentials: 'include', cache: 'no-store', signal,
            ...(!['GET', 'HEAD'].includes(method) ? {
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Protection': '1' },
                ...(data !== undefined ? { body: JSON.stringify(data) } : {})
            } : {})
        });
    } catch (error) {
        if (error.name === 'AbortError') throw error;
        throw new Error('No se pudo conectar con el servidor. Inténtalo de nuevo.', { cause: error });
    }
    const result = await response.json().catch(() => null);
    if (!response.ok) {
        const error = new Error(response.status === 401
            ? 'Tu sesión no está activa. Inicia sesión para continuar.'
            : result?.message ?? 'No se pudo completar la operación. Inténtalo de nuevo.');
        error.status = response.status;
        throw error;
    }
    if (result === null) throw new Error('El servidor no devolvió una respuesta válida.');
    return result;
}
