import React from 'react';

export function PageHeader({ title, subtitle, actionLabel, onAction }) {
    return (
        <header className="page-header">
            <div className="page-header-info">
                <h1 className="page-title">{title}</h1>
                {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {actionLabel && (
                <div className="page-header-actions">
                    <button type="button" className="btn btn-primary" onClick={onAction}>
                        + {actionLabel}
                    </button>
                </div>
            )}
        </header>
    );
}