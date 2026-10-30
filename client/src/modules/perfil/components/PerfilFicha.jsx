import { Avatar } from './Avatar.jsx';
import { CerrarSesion } from '../../login/components/CerrarSesion.jsx';
import { Pencil, ShieldCheck } from 'lucide-react';

export function PerfilFicha({ registro: usuario, onEdit }) {
    return <div className="profile-card">
        <div className="profile-banner" aria-hidden="true"><span>CAPECOMSIL S.A.</span></div>
        <div className="profile-identity">
            <Avatar nombre={usuario.nombre} url={usuario.imagen_url} />
            <h2>{usuario.nombre}</h2>
            <span className="profile-role"><ShieldCheck size={15} aria-hidden="true" />{{ JEFE: 'Jefe', OPERADOR: 'Operador' }[usuario.rol] ?? usuario.rol}</span>
        </div>
        <dl className="record-detail">
            <div><dt>Nombre</dt><dd>{usuario.nombre}</dd></div>
            <div><dt>Nombre de usuario</dt><dd>{usuario.nombre_usuario}</dd></div>
            <div><dt>Correo electrónico</dt><dd>{usuario.correo || 'Sin correo registrado'}</dd></div>
            <div><dt>Rol</dt><dd>{{ JEFE: 'Jefe', OPERADOR: 'Operador' }[usuario.rol] ?? usuario.rol}</dd></div>
        </dl>
        {usuario.requiere_cambio_password && <p role="status">Debes cambiar tu contraseña temporal antes de editar el perfil.</p>}
        <div className="profile-actions">{onEdit && <button type="button" className="btn btn-primary" onClick={onEdit}><Pencil size={16} aria-hidden="true" />Editar perfil</button>}<CerrarSesion /></div>
    </div>;
}
