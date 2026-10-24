
import React from 'react';

export function DataTable({
    columns = [],
    data = [],
    rowKey = 'id',
    loading = false,
    error = null,
    emptyMessage = 'No hay registros disponibles',
    maxColumns = 4
}) {
    // Identificar la columna de acciones
    const actionColumn = columns.find(
        (col) => col.key === 'actions'
    );

    // Obtener únicamente las columnas de información
    const infoColumns = columns.filter(
        (col) => col.key !== 'actions'
    );

    // Máximo 4 columnas de información + acciones
    const visibleColumns = [
        ...infoColumns.slice(0, maxColumns),
        ...(actionColumn ? [actionColumn] : [])
    ];

    return (
        <div className="table-wrapper">
            <table className="data-table">
                <thead>
                    <tr>
                        {visibleColumns.map((col) => (
                            <th key={col.key}>{col.label}</th>
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
                                    <td key={col.key}>
                                        {col.render
                                            ? col.render(row)
                                            : typeof row[col.key] === 'boolean'
                                                ? (row[col.key]
                                                    ? (col.key === 'estado'
                                                        ? 'Activo'
                                                        : 'Sí')
                                                    : (col.key === 'estado'
                                                        ? 'Inactivo'
                                                        : 'No'))
                                                : row[col.key] ?? '—'}
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
