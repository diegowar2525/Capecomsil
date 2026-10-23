import { Avatar } from './Avatar.jsx';
import { usePerfil } from '../hooks/usePerfil.js';

export function SidebarPerfil({ activePath, onClose }) {
    const { usuario, loading } = usePerfil();
    return <a className="sidebar-profile" href="#/perfil" onClick={onClose}
        aria-label={usuario ? `Editar perfil de ${usuario.nombre}` : 'Consultar mi perfil'}
        aria-current={activePath === '/perfil' ? 'page' : undefined}>
        <Avatar nombre={usuario?.nombre} url={usuario?.imagen_url} />
        <span className="sidebar-profile-info">
            <strong>{usuario?.nombre ?? (loading ? 'Cargando perfil…' : 'Perfil no disponible')}</strong>
            <span>{usuario ? ({ JEFE: 'Jefe', OPERADOR: 'Operador' }[usuario.rol] ?? usuario.rol) : 'Mi perfil'}</span>
        </span>
    </a>;
}
