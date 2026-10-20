import React from 'react';

const NAV_GROUPS = [
    {
        section: 'General',
        items: [
            { id: 'dashboard', label: 'Dashboard' },
        ],
    },
    {
        section: 'Operaciones',
        items: [
            { id: 'viajes', label: 'Viajes' },
            { id: 'costos-viaje', label: 'Costos de Viaje' },
            { id: 'liquidaciones', label: 'Liquidaciones' },
            { id: 'mantenimiento', label: 'Mantenimiento' },
        ],
    },
    {
        section: 'Finanzas y Facturación',
        items: [
            { id: 'facturacion', label: 'Facturación Clientes' },
            { id: 'pagos', label: 'Cobros / Pagos' },
            { id: 'facturas-proveedores', label: 'Facturas Proveedores' },
            { id: 'pagos-proveedores', label: 'Pagos Proveedores' },
            { id: 'gastos', label: 'Gastos Operativos' },
        ],
    },
    {
        section: 'Catálogos',
        items: [
            { id: 'vehiculos', label: 'Vehículos / Tanqueros' },
            { id: 'choferes', label: 'Choferes' },
            { id: 'gasolineras', label: 'Gasolineras / Clientes' },
            { id: 'terminales', label: 'Terminales de Carga' },
            { id: 'productos', label: 'Productos (Combustibles)' },
            { id: 'proveedores', label: 'Proveedores' },
        ],
    },
];

export function Sidebar({ activeView, onSelectView }) {
    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <span className="sidebar-brand-title">Capecomsil S.A</span>
            </div>

            <nav className="sidebar-nav">
                {NAV_GROUPS.map((group) => (
                    <div key={group.section}>
                        <p className="sidebar-section-label">{group.section}</p>
                        <ul className="sidebar-menu-list">
                            {group.items.map((item) => (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        className={`sidebar-link ${activeView === item.id ? 'active' : ''}`}
                                        onClick={() => onSelectView(item.id)}
                                    >
                                        <span>{item.label}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>
        </aside>
    );
}