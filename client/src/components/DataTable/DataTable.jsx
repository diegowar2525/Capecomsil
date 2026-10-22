import React from 'react';

export function DataTable({ columns = [], data = [], rowKey = 'id', loading = false, error = null, emptyMessage = 'No hay registros disponibles' }) {
    return (
        <div className="table-wrapper">
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key}>{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {loading || error || data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length || 1} className="table-empty-state">
                                <span role={error ? 'alert' : 'status'}>{loading ? 'Cargando…' : error || emptyMessage}</span>
                            </td>
                        </tr>
                    ) : (
                        data.map((row, idx) => (
                            <tr key={(typeof rowKey === 'function' ? rowKey(row) : row[rowKey]) ?? idx}>
                                {columns.map((col) => (
                                    <td key={col.key}>
                                        {col.render ? col.render(row) : typeof row[col.key] === 'boolean'
                                            ? (row[col.key] ? (col.key === 'estado' ? 'Activo' : 'Sí') : (col.key === 'estado' ? 'Inactivo' : 'No'))
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
