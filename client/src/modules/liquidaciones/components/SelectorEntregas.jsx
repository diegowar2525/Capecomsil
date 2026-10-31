import { useId } from 'react';
import '../../../styles/modules/liquidaciones.css';

const numero = value => new Intl.NumberFormat('es-EC', { maximumFractionDigits: 2 }).format(Number(value));
const dinero = value => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(value));

export function SelectorEntregas({ entregas, seleccion, onChange, disabled, loading, error, ready }) {
    const titleId = useId();
    const ids = new Set(seleccion.map(String));
    const elegidas = entregas.filter(row => ids.has(String(row.id_detalle_viaje)));
    const cambiar = (id, checked) => onChange(checked ? [...ids, String(id)] : [...ids].filter(value => value !== String(id)));
    return <section className="selector-entregas" aria-labelledby={titleId} aria-busy={loading}>
        <header className="selector-entregas__header">
            <div><h3 id={titleId}>Entregas disponibles</h3><p>Marca las entregas que quieres incluir en la liquidación.</p></div>
            <span className="selector-entregas__contador" role="status">{elegidas.length} de {entregas.length} seleccionadas</span>
        </header>
        {loading ? <p role="status">Consultando entregas…</p> : error ? <p role="alert">{error}</p> : !ready ? <p>Selecciona una gasolinera y el período para ver sus entregas.</p> : !entregas.length ? <p>No hay entregas disponibles para este período.</p> : <>
            <div className="selector-entregas__acciones">
                <button type="button" className="btn btn-outline" disabled={disabled || elegidas.length === entregas.length} onClick={() => onChange(entregas.map(row => String(row.id_detalle_viaje)))}>Seleccionar todas</button>
                <button type="button" className="btn btn-outline" disabled={disabled || !ids.size} onClick={() => onChange([])}>Limpiar selección</button>
            </div>
            <div className="selector-entregas__lista">
                {entregas.map(row => <label key={row.id_detalle_viaje} className={`selector-entregas__item${ids.has(String(row.id_detalle_viaje)) ? ' is-selected' : ''}`}>
                    <input type="checkbox" checked={ids.has(String(row.id_detalle_viaje))} disabled={disabled} aria-label={`Seleccionar entrega ${row.id_detalle_viaje}`} onChange={event => cambiar(row.id_detalle_viaje, event.target.checked)} />
                    <span className="selector-entregas__datos">
                        <strong>Entrega {row.id_detalle_viaje}{row.placa ? ` · ${row.placa}` : ''}</strong>
                        <span>{[row.fecha_inicio?.slice(0, 10).split('-').reverse().join('/'), row.id_viaje ? `Viaje ${row.id_viaje}` : null, row.nombre_producto_transportado].filter(Boolean).join(' · ')}</span>
                        {row.nombre_terminal && <span>Origen: {row.nombre_terminal}</span>}
                    </span>
                    <span className="selector-entregas__importe"><strong>{dinero(row.valor_transporte)}</strong><span>{numero(row.galones)} galones</span></span>
                </label>)}
            </div>
            <footer className="selector-entregas__resumen"><span>Selección actual</span><strong>{numero(elegidas.reduce((sum, row) => sum + Number(row.galones), 0))} galones</strong><strong>{dinero(elegidas.reduce((sum, row) => sum + Number(row.valor_transporte), 0))}</strong></footer>
        </>}
    </section>;
}
