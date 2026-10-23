import { SidebarPerfil } from '../../modules/perfil/components/SidebarPerfil.jsx';

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
                <span className="sidebar-section-chevron" aria-hidden="true">
                    {isExpanded ? '▾' : '▸'}
                </span>
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
                            <span>{item.label}</span>
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
                <a className="sidebar-brand-title" href="#/dashboard" onClick={onClose}
                    aria-label="Capecomsil S.A — Ir al dashboard"
                    aria-current={activePath === '/dashboard' ? 'page' : undefined}>
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
