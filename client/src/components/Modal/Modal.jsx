import { useEffect, useId, useRef } from 'react';

export function Modal({ isOpen, title, onClose, children, footer, className = '' }) {
    const titleId = useId();
    const ref = useRef(null);
    const closeRef = useRef(onClose);
    useEffect(() => { closeRef.current = onClose; }, [onClose]);
    useEffect(() => {
        if (!isOpen) return;
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        ref.current?.focus();
        const handleKey = (event) => {
            if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
            if (event.key !== 'Tab') return;
            const elements = Array.from(ref.current?.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') ?? [])
                .filter((element) => element.getClientRects().length > 0);
            const first = elements[0];
            const last = elements.at(-1);
            if (!first) { event.preventDefault(); return; }
            if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
                event.preventDefault(); last.focus();
            } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) {
                event.preventDefault(); first.focus();
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKey);
            if (previousFocus?.isConnected) previousFocus.focus();
        };
    }, [isOpen]);
    if (!isOpen) return null;
    return <div className="modal-overlay" onClick={onClose}>
        <div ref={ref} className={`modal-container ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId}
            tabIndex={-1} onClick={(event) => event.stopPropagation()}>
            <div className="modal-header"><h2 id={titleId} className="modal-title">{title}</h2>
                <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Cerrar modal">✕</button>
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
        </div>
    </div>;
}
