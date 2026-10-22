import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { DataTable } from '../../components/DataTable/DataTable.jsx';
import { columns } from './mantenimiento.columns.js';
import { page } from './mantenimiento.config.js';

export function MantenimientoPage() {
    return (
        <section>
            <PageHeader title={page.title} subtitle={page.subtitle} />
            <DataTable rowKey="id_mantenimiento" columns={columns} data={[]} emptyMessage="Esta pantalla aún no está conectada al sistema." />
        </section>
    );
}
