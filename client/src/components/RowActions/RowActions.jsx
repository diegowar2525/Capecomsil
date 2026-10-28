
import { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Pencil, Trash2, Ban, EllipsisVertical } from 'lucide-react';

const actionIcons = {
    eye: Eye,
    pencil: Pencil,
    trash: Trash2,
    ban: Ban
};

export function RowActions({ actions, onAction }) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState(null);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const menuId = `row-actions-${useIdSafe()}`;

    const availableActions = actions;

    const closeMenu = (restoreFocus = false) => {
        setOpen(false);
        if (restoreFocus) triggerRef.current?.focus();
    };

    useLayoutEffect(() => {
        if (!open) return;

        const updatePosition = () => {
            const trigger = triggerRef.current;
            const menu = menuRef.current;
            if (!trigger || !menu) return;

            const rect = trigger.getBoundingClientRect();
            const menuWidth = menu.offsetWidth;
            const menuHeight = menu.offsetHeight;
            const margin = 8;

            const left = Math.max(
                margin,
                Math.min(
                    rect.right - menuWidth,
                    window.innerWidth - menuWidth - margin
                )
            );

            const showAbove =
                rect.bottom + menuHeight + margin > window.innerHeight &&
                rect.top >= menuHeight + margin;

            setPosition({
                left,
                top: showAbove
                    ? rect.top - menuHeight - 4
                    : Math.min(
                        rect.bottom + 4,
                        window.innerHeight - menuHeight - margin
                    )
            });
        };

        updatePosition();

        const handlePointerDown = (event) => {
            if (
                !menuRef.current?.contains(event.target) &&
                !triggerRef.current?.contains(event.target)
            ) {
                closeMenu();
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeMenu(true);
            }
        };

        const handleScroll = () => closeMenu();

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleScroll);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleScroll);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [open]);

    const selectAction = (action) => {
        closeMenu();
        onAction(action);
    };

    return (
        <div className="record-actions">
            <div className="record-actions-desktop">
                {availableActions.map((action) => {
                    const Icon = actionIcons[action.icon];

                    return (
                        <button
                            key={action.id}
                            type="button"
                            className={`record-action-btn record-action-${action.id}`}
                            onClick={() => onAction(action)}
                            title={action.label}
                            aria-label={action.label}
                        >
                            {Icon
                                ? <Icon size={18} strokeWidth={1.8} />
                                : action.label}
                        </button>
                    );
                })}
            </div>

            <button
                ref={triggerRef}
                type="button"
                className="record-actions-trigger"
                aria-label="Opciones del registro"
                aria-haspopup="true"
                aria-expanded={open}
                aria-controls={open ? menuId : undefined}
                onClick={() => setOpen((previous) => !previous)}
            >
                <EllipsisVertical size={20} aria-hidden="true" />
            </button>

            {open && createPortal(
                <div
                    ref={menuRef}
                    id={menuId}
                    className="record-actions-menu"
                    style={{
                        position: 'fixed',
                        left: position?.left ?? -9999,
                        top: position?.top ?? -9999,
                        visibility: position ? 'visible' : 'hidden'
                    }}
                    role="group"
                    aria-label="Acciones del registro"
                >
                    {availableActions.map((action) => {
                        const Icon = actionIcons[action.icon];

                        return (
                            <button
                                key={action.id}
                                type="button"
                                className={`record-actions-menu-item record-action-${action.id}`}
                                onClick={() => selectAction(action)}
                            >
                                {Icon && <Icon size={17} aria-hidden="true" />}
                                <span>{action.label}</span>
                            </button>
                        );
                    })}
                </div>,
                document.body
            )}
        </div>
    );
}

import { useId } from 'react';

function useIdSafe() {
    return useId().replace(/:/g, '');
}
