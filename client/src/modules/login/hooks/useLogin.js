import { useForm } from '../../../hooks/useForm.js';
import { iniciarSesion } from '../services/login.api.js';
import { prepararLogin } from '../domain/credenciales.js';

export function useLogin(onSuccess) {
    return useForm({ initialValues: { nombre_usuario: '', password: '' },
        prepare: prepararLogin, onSubmit: iniciarSesion, onSuccess });
}
