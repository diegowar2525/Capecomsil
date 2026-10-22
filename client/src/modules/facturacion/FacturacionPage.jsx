import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { DataTable } from '../../components/DataTable/DataTable.jsx';
import { columns } from './facturacion.columns.js';
import { page } from './facturacion.config.js';

export function FacturacionPage() {
    return (
        <section>
            <PageHeader title={page.title} subtitle={page.subtitle} />
            <DataTable rowKey="id_factura" columns={columns} data={[]} emptyMessage="Esta pantalla aún no está conectada al sistema." />
        </section>
    );
}
