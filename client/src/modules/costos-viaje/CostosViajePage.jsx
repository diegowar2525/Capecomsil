import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { DataTable } from '../../components/DataTable/DataTable.jsx';
import { columns } from './costos-viaje.columns.js';
import { page } from './costos-viaje.config.js';

export function CostosViajePage() {
    return (
        <section>
            <PageHeader title={page.title} subtitle={page.subtitle} />
            <DataTable rowKey="id_costo_viaje" columns={columns} data={[]} emptyMessage="Esta pantalla aún no está conectada al sistema." />
        </section>
    );
}
