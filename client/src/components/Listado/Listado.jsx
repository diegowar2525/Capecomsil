import { DataTable } from '../DataTable/DataTable.jsx';

// La presentación no conoce endpoints, permisos ni reglas del módulo.
export function Listado({ toolbar, pagination, columns, data, rowKey, loading, error, emptyMessage }) {
    return <>
        {toolbar}
        <DataTable columns={columns} data={data} rowKey={rowKey} loading={loading} error={error} emptyMessage={emptyMessage} />
        {!loading && !error && pagination}
    </>;
}
