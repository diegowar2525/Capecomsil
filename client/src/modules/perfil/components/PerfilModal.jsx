import { useId, useState } from 'react';
import { FormField } from '../../../components/FormField/FormField.jsx';
import { Modal } from '../../../components/Modal/Modal.jsx';
import { prepararPerfil } from '../domain/perfil.js';

export function PerfilModal({ usuario, guardar, onClose, onSaved }) {
    const formId = useId();
    const [fields, setFields] = useState({ nombre: usuario.nombre, correo: usuario.correo ?? '', imagen_url: usuario.imagen_url ?? '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const change = (event) => setFields((value) => ({ ...value, [event.target.name]: event.target.value }));
    const submit = async (event) => {
        event.preventDefault();
        if (saving) return;
        setError('');
        try {
            const data = prepararPerfil(fields);
            setSaving(true);
            await guardar(data);
            onSaved();
        } catch (failure) { setError(failure.message); }
        finally { setSaving(false); }
    };
    return <Modal isOpen title="Editar mi perfil" onClose={() => { if (!saving) onClose(); }} footer={<>
        <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Cancelar</button>
        <button type="submit" form={formId} className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
    </>}>
        <form id={formId} className="form-grid" onSubmit={submit} aria-busy={saving}>
            <FormField name="nombre" label="Nombre" required maxLength={150} autoComplete="name" value={fields.nombre} onChange={change} disabled={saving} />
            <FormField name="correo" label="Correo electrónico" type="email" maxLength={254} autoComplete="email" value={fields.correo} onChange={change} disabled={saving} />
            <FormField name="imagen_url" label="URL de la foto de perfil" type="url" maxLength={2048} value={fields.imagen_url} onChange={change} disabled={saving} />
            <div className="form-group full-width"><p>Usa una dirección HTTP o HTTPS de tu foto. Deja el campo vacío para quitarla.</p></div>
            {error && <p className="form-group full-width" role="alert">{error}</p>}
        </form>
    </Modal>;
}
