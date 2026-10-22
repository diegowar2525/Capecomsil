
import { useRef } from 'react';

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
                <span className="sidebar-brand-title">
                    Capecomsil S.A
                </span>

                <button
                    type="button"
                    className="sidebar-close-btn"
                    onClick={onClose}
                    aria-label="Cerrar menú"
                >
                    &times;
                </button>
            </div>

            <nav className="sidebar-nav">
                {groups.map((group) => (
                    <div key={group.section}>
                        <p className="sidebar-section-label">
                            {group.section}
                        </p>

                        <ul className="sidebar-menu-list">
                            {group.items.map((item) => (
                                <li key={item.path}>
                                    <a
                                        href={`#${item.path}`}
                                        aria-current={
                                            activePath === item.path
                                                ? 'page'
                                                : undefined
                                        }
                                        className={`sidebar-link ${
                                            activePath === item.path
                                                ? 'active'
                                                : ''
                                        }`}
                                        onClick={onClose}
                                    >
                                        <span>{item.label}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>
        </aside>
    );
}
