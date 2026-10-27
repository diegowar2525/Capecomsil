import { useForm } from '../../../hooks/useForm.js';
import { cambiarPassword } from '../services/login.api.js';
import { prepararPassword } from '../domain/credenciales.js';

export function useCambioPassword(onSuccess) {
    return useForm({ initialValues: { password_actual: '', password_nueva: '', confirmacion: '' },
        prepare: prepararPassword, onSubmit: cambiarPassword, onSuccess });
}
