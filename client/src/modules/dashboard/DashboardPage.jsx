import { columns } from './dashboard.columns.js';
import { useDashboard } from './hooks/useDashboard.js';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { DataTable } from '../../components/DataTable/DataTable';

export function Dashboard() {
    const { stats, recentTrips, loading, error } = useDashboard();


    return (
        <div>
            <PageHeader
                title="Panel de Control Operativo"
                subtitle="Viajes válidos del mes actual y liquidaciones en borrador"
            />

            {loading && <p role="status">Cargando resumen…</p>}
            {error && <p role="alert">{error}</p>}
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
                    <strong className="kpi-value">Pendiente de API</strong>
                </div>
            </section>

            <section className="surface-card">
                <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Actividad Reciente de Viajes</h3>
                <DataTable rowKey="id_viaje" columns={columns} data={recentTrips} loading={loading} error={error} />
            </section>
        </div>
    );
}
