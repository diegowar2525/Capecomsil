import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { DataTable } from '../../components/DataTable/DataTable.jsx';
import { columns } from './pagos.columns.js';
import { page } from './pagos.config.js';

export function PagosPage() {
    return (
        <section>
            <PageHeader title={page.title} subtitle={page.subtitle} />
            <DataTable rowKey="id_pago" columns={columns} data={[]} emptyMessage="Esta pantalla aún no está conectada al sistema." />
        </section>
    );
}
