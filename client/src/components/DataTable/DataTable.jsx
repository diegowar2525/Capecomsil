
import { Check, X } from 'lucide-react';
import { FotoMiniatura } from '../FotoMiniatura/FotoMiniatura.jsx';


export function DataTable({
    columns = [],
    data = [],
    rowKey = 'id',
    maxInfoColumns = 6,
    loading = false,
    error = null,
    emptyMessage = 'No hay registros disponibles'
}) {
    const actionColumn = columns.find(
        (col) => col.key === 'actions'
    );

    const statusColumn = columns.find(
        (col) => col.key === 'estado'
    );

    const infoColumns = columns.filter(
        (col) => col.key !== 'actions' && col.key !== 'estado'
    );

    // Los listados resumen datos; las tablas de consulta sin acciones conservan sus columnas.
    const limit = actionColumn ? maxInfoColumns : infoColumns.length;
    const visibleColumns = [
        ...infoColumns.slice(0, limit),
        ...(statusColumn ? [statusColumn] : []),
        ...(actionColumn ? [actionColumn] : [])
    ];

    const getColumnClass = (key) => {
        return [
            'id',
            rowKey,
            'estado',
            'actions'
        ].includes(key)
            ? 'table-cell-center'
            : '';
    };


    const renderCell = (col, row) => {
        if (col.render) return col.render(row);

        const value = row[col.key];
        if (col.type === 'image') return <FotoMiniatura url={value} nombre={row[col.labelKey]} rostro={col.rostro} />;

        // Mostrar iconos para el campo Estado
        if (col.key === 'estado' && typeof value === 'boolean') {
            return (
                <span
                    className={`table-status ${value ? 'is-active' : 'is-inactive'}`}
                    title={value ? 'Activo' : 'Inactivo'}
                    role="img"
                    aria-label={value ? 'Activo' : 'Inactivo'}
                >
                    {value
                        ? <Check size={20} strokeWidth={2.5} aria-hidden="true" />
                        : <X size={20} strokeWidth={2.5} aria-hidden="true" />
                    }
                </span>
            );
        }

        // Otros campos booleanos
        if (typeof value === 'boolean') {
            return value ? 'Sí' : 'No';
        }

        return value ?? '—';
    };


    return (
        <div className="table-wrapper" role="region" aria-label="Tabla de datos, desplazamiento horizontal" tabIndex={0}>
            <table className="data-table">
                <thead>
                    <tr>
                        {visibleColumns.map((col) => (
                            <th
                                key={col.key}
                                className={getColumnClass(col.key)}
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {loading || error || data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={visibleColumns.length || 1}
                                className="table-empty-state"
                            >
                                <span role={error ? 'alert' : 'status'}>
                                    {loading
                                        ? 'Cargando…'
                                        : error || emptyMessage}
                                </span>
                            </td>
                        </tr>
                    ) : (
                        data.map((row, idx) => (
                            <tr
                                key={
                                    (typeof rowKey === 'function'
                                        ? rowKey(row)
                                        : row[rowKey]) ?? idx
                                }
                            >
                                {visibleColumns.map((col) => (
                                    <td
                                        key={col.key}
                                        className={getColumnClass(col.key)}
                                    >
                                        {renderCell(col, row)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
