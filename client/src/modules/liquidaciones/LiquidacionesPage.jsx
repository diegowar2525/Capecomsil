import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { DataTable } from '../../components/DataTable/DataTable.jsx';
import { columns } from './liquidaciones.columns.js';
import { page } from './liquidaciones.config.js';

export function LiquidacionesPage() {
    return (
        <section>
            <PageHeader title={page.title} subtitle={page.subtitle} />
            <DataTable columns={columns} data={[]} emptyMessage="Esta pantalla aún no está conectada al sistema." />
        </section>
    );
}
