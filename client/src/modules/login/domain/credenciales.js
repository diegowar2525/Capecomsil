import { formError } from '../../../domain/formError.js';

export function prepararLogin({ nombre_usuario, password }) {
    const usuario = nombre_usuario.trim().toLowerCase();
    if (!usuario) throw formError('nombre_usuario', 'Introduce tu nombre de usuario.');
    if (!/^[a-z0-9][a-z0-9._-]{2,49}$/.test(usuario)) throw formError('nombre_usuario', 'El nombre de usuario debe tener entre 3 y 50 caracteres: letras, números, puntos, guiones o guiones bajos.');
    if (!password) throw formError('password', 'Introduce tu contraseña.');
    return { nombre_usuario: usuario, password };
}

export function prepararPassword({ password_actual, password_nueva, confirmacion }) {
    if (!password_actual) throw formError('password_actual', 'Introduce tu contraseña actual.');
    if ([...password_nueva].length < 10 || [...password_nueva].length > 128) throw formError('password_nueva', 'La contraseña nueva debe tener entre 10 y 128 caracteres.');
    if (password_actual === password_nueva) throw formError('password_nueva', 'La contraseña nueva debe ser diferente.');
    if (password_nueva !== confirmacion) throw formError('confirmacion', 'Las contraseñas nuevas no coinciden.');
    return { password_actual, password_nueva };
}
