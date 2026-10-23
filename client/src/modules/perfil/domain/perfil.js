export function prepararPerfil({ nombre, correo, imagen_url }) {
    const name = nombre.trim();
    const email = correo.trim();
    const image = imagen_url.trim();
    if (!name || name.length > 150) throw new Error('Indica un nombre de hasta 150 caracteres.');
    if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw new Error('Indica un correo válido.');
    if (image) {
        let url;
        try { url = new URL(image); } catch { throw new Error('Indica una URL HTTP o HTTPS válida para la foto.'); }
        if (image.length > 2048 || !['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
            throw new Error('Indica una URL HTTP o HTTPS sin credenciales para la foto.');
        }
    }
    return { nombre: name, correo: email || null, imagen_url: image || null };
}
