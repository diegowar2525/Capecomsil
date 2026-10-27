import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { DataTable } from '../../components/DataTable/DataTable.jsx';
import { columns } from './pagos.columns.js';
import { page } from './pagos.config.js';

export function PagosPage() {
    return (
        <section>
            <PageHeader title={page.title} subtitle={page.subtitle} />
            <DataTable rowKey="id_pago" columns={columns} data={[]} emptyMessage="Pendiente de implementar: el servidor aún no dispone de una API de facturación y cobros a clientes." />
        </section>
    );
}
