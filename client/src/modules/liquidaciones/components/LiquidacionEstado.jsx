import { FileText, ClipboardCheck, CircleCheck, CircleSlash } from 'lucide-react';
const nombres = { BORRADOR: 'Borrador', PREPARADA: 'Preparada', CONFIRMADA: 'Confirmada', ANULADA: 'Anulada' };
const descripciones = {
    BORRADOR: 'La liquidación está en elaboración. Puedes editar sus entregas o eliminarla antes de prepararla.',
    PREPARADA: 'La liquidación está lista para revisión. Puedes confirmarla o volver a borrador para editarla.',
    CONFIRMADA: 'La liquidación está aprobada y permite registrar su factura. Sus entregas e importes ya no se pueden editar.',
    ANULADA: 'La liquidación dejó de estar vigente. Se conserva como historial y sus entregas quedan disponibles para otra liquidación.'
};
const iconos = { BORRADOR: FileText, PREPARADA: ClipboardCheck, CONFIRMADA: CircleCheck, ANULADA: CircleSlash };
export function LiquidacionEstado({ estado, onClick }) {
    const Icon = iconos[estado] ?? FileText;
    const className = `liquidacion-estado liquidacion-estado--${estado?.toLowerCase()}`;
    return onClick ? <button type="button" className={className} onClick={onClick} title={nombres[estado]} aria-label={`Ver estado: ${nombres[estado]}`}><Icon size={22} aria-hidden="true" /></button>
        : <span className={className} role="img" aria-label={nombres[estado]} title={nombres[estado]}><Icon size={22} aria-hidden="true" /></span>;
}
export function LiquidacionProgreso({ registro }) {
    const pasos = ['ANULADA', 'BORRADOR', 'PREPARADA', 'CONFIRMADA'];
    return <section className="liquidacion-progreso" aria-label="Estado de la liquidación">
        <ol>{pasos.map((estado, index) => <li key={estado} aria-current={estado === registro.estado ? 'step' : undefined}
            className={estado === 'ANULADA' ? 'estado-anulado' : registro.estado !== 'ANULADA' && index <= pasos.indexOf(registro.estado) ? 'completado' : ''}>
            {estado === 'ANULADA' ? <CircleSlash size={18} aria-hidden="true" /> : `${index}. `}{nombres[estado]}
        </li>)}</ol>
        {registro.estado === 'ANULADA' && <div className="liquidacion-motivo"><strong>Motivo de anulación</strong><p>{registro.motivo_anulacion}</p></div>}
    </section>;
}
export function LiquidacionConfirmacion({ action, registro }) {
    if (!['send', 'confirm', 'reopen', 'state'].includes(action.id)) return null;
    return <dl className="liquidacion-confirmacion">
        <div><dt>Gasolinera</dt><dd>{registro.nombre_gasolinera}</dd></div>
        <div><dt>Período</dt><dd>{registro.periodo_inicio} — {registro.periodo_fin}</dd></div>
        <div><dt>Total</dt><dd>{new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(registro.total_liquidacion))}</dd></div>
    </dl>;
}

export function LiquidacionEstadoDetalle({ registro }) {
    const fecha = value => value ? new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
    return <>
        <h3>{nombres[registro.estado]}</h3>
        <p className="liquidacion-estado-descripcion">{descripciones[registro.estado]}</p>
        <LiquidacionProgreso registro={registro} />
        <dl className="liquidacion-confirmacion">
            {[['Creación', registro.fecha_generacion], ['Preparación', registro.fecha_envio], ['Confirmación', registro.fecha_confirmacion], ['Anulación', registro.fecha_anulacion]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{fecha(value)}</dd></div>)}
        </dl>
        <details className="liquidacion-historial"><summary>Historial de estados</summary>
            {registro.historial?.length ? <ol>{registro.historial.map(item => <li key={item.id_historial}>
                <strong>{nombres[item.estado_anterior]} → {nombres[item.estado_nuevo]}</strong>
                <span>{fecha(item.fecha)}{item.usuario ? ` · ${item.usuario}` : ''}</span>
            </li>)}</ol> : <p>No hay transiciones registradas en el historial.</p>}
        </details>
    </>;
}
