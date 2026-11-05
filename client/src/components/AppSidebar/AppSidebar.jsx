import { ChevronDown } from 'lucide-react';
import { SidebarIcon } from './SidebarIcon.jsx';
import { SidebarPerfil } from '../../modules/perfil/components/SidebarPerfil.jsx';
import { useAuth } from '../../modules/auth/hooks/useAuth.js';

import { useId, useState } from 'react';

function SidebarGroup({ group, activePath, onClose }) {
    const menuId = useId();
    const [isExpanded, setIsExpanded] = useState(() =>
        group.items.some((item) => item.path === activePath)
    );

    return (
        <div>
            <button
                type="button"
                className="sidebar-section-label"
                aria-expanded={isExpanded}
                aria-controls={menuId}
                onClick={() => setIsExpanded((expanded) => !expanded)}
            >
                <span>{group.section}</span>
                <ChevronDown className="sidebar-section-chevron" size={16} aria-hidden="true" />
            </button>

            <ul id={menuId} className="sidebar-menu-list" hidden={!isExpanded}>
                {group.items.map((item) => (
                    <li key={item.path}>
                        <a
                            href={`#${item.path}`}
                            aria-current={activePath === item.path ? 'page' : undefined}
                            className={`sidebar-link ${activePath === item.path ? 'active' : ''}`}
                            onClick={onClose}
                        >
                            <SidebarIcon path={item.path} />
                            <span className="sidebar-link-label">{item.label}</span>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function Sidebar({
    groups,
    activePath,
    isOpen,
    onClose,
    sidebarRef,
    isMobile
}) {
    const { permisos } = useAuth();
    const resumenActivo = ['/resumen', '/dashboard', '/informes'].includes(activePath);
    return (
        <aside
            id="app-sidebar"
            ref={sidebarRef}
            className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}
            aria-label="Navegación principal"
            aria-modal={isMobile && isOpen ? 'true' : undefined}
            role={isMobile && isOpen ? 'dialog' : undefined}
            inert={isMobile && !isOpen}
        >
            <div className="sidebar-brand">
                <a className="sidebar-brand-title" href="#/resumen" onClick={onClose}
                    aria-label="Capecomsil S.A — Ir al resumen"
                    aria-current={resumenActivo ? 'page' : undefined}>
                    Capecomsil S.A
                </a>

                <button
                    type="button"
                    className="sidebar-close-btn"
                    onClick={onClose}
                    aria-label="Cerrar menú"
                >
                    &times;
                </button>
            </div>

            <SidebarPerfil activePath={activePath} onClose={onClose} />

            <nav className="sidebar-nav">
                {permisos.includes('informes.consultar') && <a href="#/resumen" onClick={onClose}
                    className={`sidebar-link ${resumenActivo ? 'active' : ''}`} aria-current={resumenActivo ? 'page' : undefined}>
                    <SidebarIcon path="/resumen" /><span className="sidebar-link-label">Resumen</span>
                </a>}
                {groups.map((group) => (
                    <SidebarGroup
                        key={`${group.section}:${activePath}`}
                        group={group}
                        activePath={activePath}
                        onClose={onClose}
                    />
                ))}
            </nav>
        </aside>
    );
}
