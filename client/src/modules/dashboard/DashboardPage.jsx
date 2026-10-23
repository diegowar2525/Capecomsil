import { columns } from './dashboard.columns.js';
import React from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { DataTable } from '../../components/DataTable/DataTable';

export function Dashboard({ stats = {}, recentTrips = [] }) {


    return (
        <div>
            <PageHeader
                title="Panel de Control Operativo"
                subtitle="Resumen de operaciones de transporte de combustible, viajes y facturación"
            />

            <section className="kpi-grid">
                <div className="kpi-card">
                    <span className="kpi-label">Viajes registrados</span>
                    <strong className="kpi-value">{stats.viajesRegistrados ?? '—'}</strong>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Volumen Transportado (Gal)</span>
                    <strong className="kpi-value">{stats.volumenTotal ?? '—'}</strong>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Liquidaciones en borrador</span>
                    <strong className="kpi-value">{stats.liquidacionesBorrador ?? '—'}</strong>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Facturación del Mes</span>
                    <strong className="kpi-value">{stats.facturacionMes ?? '—'}</strong>
                </div>
            </section>

            <section className="surface-card">
                <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Actividad Reciente de Viajes</h3>
                <DataTable rowKey="id_viaje" columns={columns} data={recentTrips} />
            </section>
        </div>
    );
}
