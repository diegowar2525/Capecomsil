
import { useEffect, useRef, useState } from 'react';
import { Sidebar } from '../components/AppSidebar/AppSidebar.jsx';

const MOBILE_BREAKPOINT = '(max-width: 1023px)';

export function AppLayout({ navigation, activePath, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(
        () => window.matchMedia(MOBILE_BREAKPOINT).matches
    );

    const sidebarRef = useRef(null);
    const menuButtonRef = useRef(null);
    const previousFocusRef = useRef(null);

    const isDrawerOpen = isMobile && sidebarOpen;

    // Detectar cambios de tamaño de pantalla
    useEffect(() => {
        const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT);

        const handleChange = (event) => {
            setIsMobile(event.matches);
            setSidebarOpen(false);
        };

        mediaQuery.addEventListener('change', handleChange);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    // Cerrar al cambiar de sección
    useEffect(() => {
        setSidebarOpen(false);
    }, [activePath]);

    // Bloquear scroll y administrar el foco
    useEffect(() => {
        if (!isDrawerOpen) return;

        const sidebar = sidebarRef.current;
        if (!sidebar) return;

        const previousOverflow = document.body.style.overflow;
        const previousFocus = previousFocusRef.current;

        document.body.style.overflow = 'hidden';

        const getFocusableElements = () => {
            return Array.from(
                sidebar.querySelectorAll(
                    'a[href], button:not([disabled]), ' +
                    'input:not([disabled]), ' +
                    'select:not([disabled]), ' +
                    'textarea:not([disabled]), ' +
                    '[tabindex]:not([tabindex="-1"])'
                )
            ).filter((element) => {
                return element.getClientRects().length > 0;
            });
        };

        // Enviar el foco al botón de cierre
        const closeButton = sidebar.querySelector(
            '.sidebar-close-btn'
        );

        closeButton?.focus();

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                setSidebarOpen(false);
                return;
            }

            if (event.key !== 'Tab') return;

            const focusableElements = getFocusableElements();

            if (focusableElements.length === 0) {
                event.preventDefault();
                return;
            }

            const first = focusableElements[0];
            const last = focusableElements[
                focusableElements.length - 1
            ];

            const activeElement = document.activeElement;

            if (!sidebar.contains(activeElement)) {
                event.preventDefault();
                (event.shiftKey ? last : first).focus();
                return;
            }

            if (event.shiftKey && activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (
                !event.shiftKey &&
                activeElement === last
            ) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener(
                'keydown',
                handleKeyDown
            );

            if (previousFocus?.isConnected) {
                previousFocus.focus();
            } else {
                menuButtonRef.current?.focus();
            }
        };
    }, [isDrawerOpen]);

    const openSidebar = () => {
        previousFocusRef.current = document.activeElement;
        setSidebarOpen(true);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <div className="app-layout">
            <Sidebar
                groups={navigation}
                activePath={activePath}
                isOpen={isDrawerOpen}
                onClose={closeSidebar}
                sidebarRef={sidebarRef}
                isMobile={isMobile}
            />

            {isDrawerOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={closeSidebar}
                    aria-hidden="true"
                />
            )}

            <div
                className="main-container"
                inert={isDrawerOpen}
            >
                <header className="mobile-header">
                    <button
                        ref={menuButtonRef}
                        type="button"
                        className="sidebar-toggle-btn"
                        onClick={openSidebar}
                        aria-label="Abrir menú de navegación"
                        aria-expanded={isDrawerOpen}
                        aria-controls="app-sidebar"
                    >
                        ☰
                    </button>

                    <span className="mobile-header-title">
                        Capecomsil S.A
                    </span>
                </header>

                <main className="view-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
