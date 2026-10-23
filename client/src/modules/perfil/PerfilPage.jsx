import { useState } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { usePerfil } from './hooks/usePerfil.js';
import { Avatar } from './components/Avatar.jsx';
import { PerfilModal } from './components/PerfilModal.jsx';

export function PerfilPage() {
    const { usuario, loading, error, recargar, guardar } = usePerfil();
    const [editing, setEditing] = useState(false);
    const [message, setMessage] = useState('');
    return <section>
        <PageHeader title="Mi perfil" subtitle="Tus datos personales y tu foto de perfil"
            actionLabel={usuario && !usuario.requiere_cambio_password ? 'Editar perfil' : undefined}
            onAction={() => { setMessage(''); setEditing(true); }} />
        {loading && <p role="status">Cargando tu perfil…</p>}
        {error && <div><p role="alert">{error}</p><button type="button" className="btn btn-outline" onClick={recargar}>Volver a consultar</button></div>}
        {message && <p role="status">{message}</p>}
        {usuario && <div className="profile-card">
            <Avatar nombre={usuario.nombre} url={usuario.imagen_url} />
            <dl className="record-detail">
                <div><dt>Nombre</dt><dd>{usuario.nombre}</dd></div>
                <div><dt>Nombre de usuario</dt><dd>{usuario.nombre_usuario}</dd></div>
                <div><dt>Correo electrónico</dt><dd>{usuario.correo || 'Sin correo registrado'}</dd></div>
                <div><dt>Rol</dt><dd>{{ JEFE: 'Jefe', OPERADOR: 'Operador' }[usuario.rol] ?? usuario.rol}</dd></div>
            </dl>
            {usuario.requiere_cambio_password && <p role="status">Debes cambiar tu contraseña temporal antes de editar el perfil.</p>}
        </div>}
        {editing && usuario && <PerfilModal usuario={usuario} guardar={guardar} onClose={() => setEditing(false)}
            onSaved={() => { setEditing(false); setMessage('Perfil actualizado correctamente.'); }} />}
    </section>;
}
