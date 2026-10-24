import { Avatar } from './Avatar.jsx';

export function PerfilFicha({ registro: usuario }) {
    return <div className="profile-card">
        <Avatar nombre={usuario.nombre} url={usuario.imagen_url} />
        <dl className="record-detail">
            <div><dt>Nombre</dt><dd>{usuario.nombre}</dd></div>
            <div><dt>Nombre de usuario</dt><dd>{usuario.nombre_usuario}</dd></div>
            <div><dt>Correo electrónico</dt><dd>{usuario.correo || 'Sin correo registrado'}</dd></div>
            <div><dt>Rol</dt><dd>{{ JEFE: 'Jefe', OPERADOR: 'Operador' }[usuario.rol] ?? usuario.rol}</dd></div>
        </dl>
        {usuario.requiere_cambio_password && <p role="status">Debes cambiar tu contraseña temporal antes de editar el perfil.</p>}
    </div>;
}
