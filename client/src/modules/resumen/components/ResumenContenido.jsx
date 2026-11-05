import { TablaInforme } from '../../../components/InformeImpresion/InformeImpresion.jsx';
import { dinero, columnasConceptos, columnasClientes, columnasFacturas, movimientos, criterioMensual } from '../domain/resumen.js';

export function Kpis({ items }) {
    return <div className="resumen-kpis">{items.map(([label, value]) => <div className="resumen-kpi" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>;
}
export function MensualContenido({ data }) {
    return <>
        <Kpis items={[
            ['Ingresos por viajes', dinero(data.ingresos_viajes)], ['Costos y gastos', dinero(data.total_costos)],
            ['Resultado del mes', dinero(data.resultado)], ['Cobros recibidos', dinero(data.cobros)]
        ]} />
        <p className="resumen-nota">{data.cantidad_viajes} viajes registrados en el período, según su fecha de inicio. Incluye servicios aún no facturados ni cobrados.</p>
        <div className="resumen-desgloses">
            <section className="resumen-panel"><h2>Costos y gastos del mes</h2><TablaInforme columns={columnasConceptos} rows={data.conceptos} /></section>
            <section className="resumen-panel"><h2>Movimientos de dinero</h2><TablaInforme columns={columnasConceptos} rows={movimientos(data)} /></section>
        </div>
        <p className="resumen-nota">{criterioMensual}</p>
        <p className="resumen-nota">Remuneraciones automáticas hasta {data.remuneraciones_hasta}. Los días posteriores aún no están completos.</p>
        {(data.choferes_sin_fecha > 0 || data.dias_pendientes > 0) && <p className="resumen-aviso" role="alert">El resultado puede estar incompleto: {data.choferes_sin_fecha} choferes sin fecha de inicio de trabajo y {data.dias_pendientes} días de remuneración pendientes de cálculo. Revisa la consulta de remuneraciones.</p>}
    </>;
}
export function CuentasContenido({ data, print = false }) {
    return <>
        <Kpis items={[
            ['Total por cobrar', dinero(data.total_pendiente)], ['Saldo vencido', dinero(data.total_vencido)],
            ['Facturas pendientes', data.cantidad_facturas], ['Gasolineras con deuda', data.cantidad_clientes]
        ]} />
        <section className="resumen-panel"><h2>Saldo por gasolinera</h2>
            <TablaInforme columns={columnasClientes} rows={data.clientes} empty="No hay facturas pendientes de cobro." />
        </section>
        <p className="resumen-nota">Saldo actual de todas las facturas vigentes: neto cobrable menos cobros registrados. Incluye abonos parciales; excluye anulaciones. Una factura sin fecha de vencimiento no se marca como vencida.</p>
        {data.clientes.map(cliente => print ? <section key={cliente.id_gasolinera}>
            <h3>{cliente.gasolinera} · Pendiente: {dinero(cliente.saldo)}</h3><TablaInforme columns={columnasFacturas} rows={cliente.facturas} />
        </section> : <details className="resumen-panel resumen-cliente" key={cliente.id_gasolinera}>
            <summary>{cliente.gasolinera}<span>{cliente.cantidad_facturas} facturas · {dinero(cliente.saldo)}</span></summary>
            <TablaInforme columns={columnasFacturas} rows={cliente.facturas} />
        </details>)}
    </>;
}
