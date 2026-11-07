import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import logo from '../../assets/brand/capecomsil.png';
import icono from '../../assets/brand/icono.jpeg';

export function TablaInforme({ columns, rows, totals, empty = 'No hay registros para este período.' }) {
    return <div className="informe-tabla-scroll"><table className="informe-tabla">
        <thead><tr>{columns.map(column => <th key={column.key} scope="col" className={column.numeric ? 'importe' : ''}>{column.label}</th>)}</tr></thead>
        <tbody>{rows.length ? rows.map((row, index) => <tr key={row.id_factura ?? row.id_gasolinera ?? index}>
            {columns.map(column => <td key={column.key} className={column.numeric ? 'importe' : ''}>{column.format ? column.format(row[column.key], row) : row[column.key] ?? '—'}</td>)}
        </tr>) : <tr><td colSpan={columns.length}>{empty}</td></tr>}</tbody>
        {totals && <tfoot className="reporte-totales"><tr>{columns.map((column, index) => <td key={column.key} className={column.numeric ? 'importe' : ''}>
            {index === 0 ? 'Total' : totals[column.key] != null ? (column.format ? column.format(totals[column.key], totals) : totals[column.key]) : '—'}
        </td>)}</tr></tfoot>}
    </table></div>;
}

// El portal evita imprimir el menú, modales o solo la página visible de una tabla.
// Se imprime el conjunto completo cargado para el informe seleccionado.
export function InformeImpresion({ title, subtitle, generatedAt, children, disabled = false }) {
    const [printing, setPrinting] = useState(false);
    const [error, setError] = useState('');
    const print = async () => {
        setPrinting(true); setError('');
        const previousTitle = document.title;
        try {
            const images = [...document.querySelectorAll('.informe-impresion img')];
            await Promise.all(images.map(img => img.decode()));
            await document.fonts?.ready;
            document.title = `Capecomsil - ${title} - ${subtitle}`;
            window.print();
        } catch { setError('No se pudo preparar la impresión. Inténtalo de nuevo.'); }
        finally { document.title = previousTitle; setPrinting(false); }
    };
    return <>
        <button type="button" className="btn btn-outline informe-print-button" disabled={disabled || printing} onClick={print}>
            <Printer size={18} aria-hidden="true" />{printing ? 'Preparando…' : 'Imprimir / PDF'}
        </button>
        {error && <p role="alert">{error}</p>}
        {!disabled && createPortal(<article className="informe-impresion" aria-hidden="true">
            <header className="informe-membrete"><img src={logo} alt="Capecomsil S.A. — Transporte de combustible" />
                <div><span>INFORME DE GESTIÓN</span><p>Valores expresados en USD</p></div></header>
            <div className="informe-titulo"><h1>{title}</h1><p>{subtitle}</p>
                <small>Emitido: {(generatedAt ?? '').replace('T', ' · ')} · Ecuador</small></div>
            {children}
            <footer className="informe-pie"><img src={icono} alt="" /><span>Capecomsil S.A. · Documento de consulta interna · Fin del informe</span></footer>
        </article>, document.body)}
    </>;
}
