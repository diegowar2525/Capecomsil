
import { useState, useRef, useLayoutEffect } from 'react';
import { Check, X } from 'lucide-react';

export function DataTable({
    columns = [],
    data = [],
    rowKey = 'id',
    loading = false,
    error = null,
    emptyMessage = 'No hay registros disponibles'
}) {
    const containerRef = useRef(null);
    const measureRef = useRef(null);
    const [visibleCount, setVisibleCount] = useState(null);

    const actionColumn = columns.find(
        (col) => col.key === 'actions'
    );

    const statusColumn = columns.find(
        (col) => col.key === 'estado'
    );

    const infoColumns = columns.filter(
        (col) => col.key !== 'actions' && col.key !== 'estado'
    );

    // Calcular cuántas columnas caben realmente
    useLayoutEffect(() => {
        const container = containerRef.current;
        const measureTable = measureRef.current;

        if (!container || !measureTable) return;

        const calculateColumns = () => {
            const availableWidth = container.clientWidth;
            const headers = Array.from(
                measureTable.querySelectorAll('thead th')
            );

            const widths = headers.map((th) =>
                th.getBoundingClientRect().width
            );

            const actionWidth = actionColumn
                ? widths[widths.length - 1]
                : 0;

            const statusWidth = statusColumn
                ? widths[infoColumns.length]
                : 0;

            let usedWidth = actionWidth + statusWidth;
            let count = 0;

            for (let i = 0; i < infoColumns.length; i++) {
                const columnWidth = widths[i] ?? 0;

                if (usedWidth + columnWidth > availableWidth) {
                    break;
                }

                usedWidth += columnWidth;
                count++;
            }

            // Mantener al menos una columna de información
            setVisibleCount(
                Math.min(infoColumns.length, Math.max(1, count))
            );
        };

        calculateColumns();

        const observer = new ResizeObserver(calculateColumns);
        observer.observe(container);

        return () => observer.disconnect();
    }, [columns, data, actionColumn, statusColumn, infoColumns]);

    const visibleColumns = [
        ...infoColumns.slice(0, visibleCount ?? infoColumns.length),
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
        <div ref={containerRef} className="table-wrapper">
            {/* Tabla invisible para medir columnas */}
            <div className="table-measure-container" aria-hidden="true">
                <table ref={measureRef} className="data-table table-measure">
                    <thead>
                        <tr>
                            {[
                                ...infoColumns,
                                ...(statusColumn ? [statusColumn] : []),
                                ...(actionColumn ? [actionColumn] : [])
                            ]
                                .map((col) => (
                                    <th key={col.key}>{col.label}</th>
                                ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr key={idx}>
                                {[
                                    ...infoColumns,
                                    ...(statusColumn ? [statusColumn] : []),
                                    ...(actionColumn ? [actionColumn] : [])
                                ]
                                    .map((col) => (
                                        <td key={col.key}>
                                            {col.key === 'actions'
                                                ? 'Ver Editar Eliminar'
                                                : renderCell(col, row)}
                                        </td>
                                    ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Tabla visible */}
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
