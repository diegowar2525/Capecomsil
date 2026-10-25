import { useForm } from '../../../hooks/useForm.js';
import { iniciarSesion } from '../services/login.api.js';

export function useLogin(onSuccess) {
    return useForm({
        initialValues: { nombre_usuario: '', password: '' },
        prepare: ({ nombre_usuario, password }) => {
            const usuario = nombre_usuario.trim().toLowerCase();
            if (!usuario) throw new Error('Introduce tu nombre de usuario.');
            if (!/^[a-z0-9][a-z0-9._-]{2,49}$/.test(usuario)) {
                throw new Error('El nombre de usuario debe tener entre 3 y 50 caracteres: letras, números, puntos, guiones o guiones bajos.');
            }
            if (!password) throw new Error('Introduce tu contraseña.');
            return { nombre_usuario: usuario, password };
        },
        onSubmit: iniciarSesion,
        onSuccess
    });
}
