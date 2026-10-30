export function validarFoto(archivo) {
    if (!archivo) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
        throw new Error('Selecciona una imagen JPEG, PNG o WebP.');
    }
    if (!archivo.size || archivo.size > 3 * 1024 * 1024) {
        throw new Error('La foto debe tener contenido y no superar 3 MB.');
    }
}

export function errorFoto(archivo) {
    try { validarFoto(archivo); return ''; } catch (error) { return error.message; }
}
