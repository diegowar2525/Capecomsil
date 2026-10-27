import { useForm } from '../../../hooks/useForm.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { cerrarSesion } from '../services/login.api.js';

export function CerrarSesion() {
    const { establecerSesion } = useAuth();
    const form = useForm({ initialValues: {}, onSubmit: cerrarSesion, onSuccess: () => establecerSesion(null) });
    return <form onSubmit={form.submit}>
        {form.error && <p role="alert">{form.error}</p>}
        <button type="submit" className="btn btn-outline" disabled={form.saving}>{form.saving ? 'Cerrando…' : 'Cerrar sesión'}</button>
    </form>;
}
