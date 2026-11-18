import { TablaInforme } from '../../../components/InformeImpresion/InformeImpresion.jsx';
import { dinero, columnasConceptos, columnasClientes, columnasFacturas, movimientos, criterioMensual } from '../domain/resumen.js';

export function Kpis({ items }) {
    return <div className="resumen-kpis">{items.map(([label, value]) => <div className="resumen-kpi" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>;
}
export function MensualContenido({ data }) {
    return <>
        <Kpis items={[
            ['Ingresos por viajes', dinero(data.ingresos_viajes)], ['Costos y gastos', dinero(data.total_costos)],
            ['Resultado del mes', dinero(data.resultado)], ['Cobros recibidos', dinero(data.cobros)], ['Galones transportados', Number(data.galones ?? 0).toLocaleString('es-EC')], ['Viajes', data.cantidad_viajes]
        ]} />
        <p className="resumen-nota">{data.cantidad_viajes} viajes registrados en el período, según su fecha de inicio. Incluye servicios aún no facturados ni cobrados.</p>
        <section className="resumen-panel"><h2>Producción por gasolinera</h2><TablaInforme columns={[
            { key: 'gasolinera', label: 'Gasolinera' }, { key: 'viajes', label: 'Viajes', numeric: true },
            { key: 'entregas', label: 'Entregas', numeric: true }, { key: 'galones', label: 'Galones', numeric: true },
            { key: 'ingresos', label: 'Ingresos', numeric: true, format: dinero }
        ]} rows={data.produccion ?? []} totals={{ galones: data.galones, ingresos: data.ingresos_viajes,
            entregas: (data.produccion ?? []).reduce((n, r) => n + r.entregas, 0) }} />
        <p className="resumen-nota">Un viaje puede atender varias gasolineras; los viajes por gasolinera no se suman.</p></section>
        <div className="resumen-desgloses">
            <section className="resumen-panel"><h2>Costos y gastos del mes</h2><TablaInforme columns={[...columnasConceptos, { key: 'porcentaje', label: '% del costo', numeric: true, format: value => `${value.toFixed(2)}%` }]} rows={data.conceptos.map(row => ({ ...row, porcentaje: Number(data.total_costos) ? Number(row.importe) * 100 / Number(data.total_costos) : 0 }))} totals={{ importe: data.total_costos }} /></section>
            <section className="resumen-panel"><h2>Movimientos de dinero</h2><TablaInforme columns={columnasConceptos} rows={movimientos(data)} /></section>
        </div>
        <section className="resumen-panel"><h2>Pagos por proveedor</h2><TablaInforme columns={[
            { key: 'proveedor', label: 'Proveedor' }, { key: 'importe', label: 'Pagado', numeric: true, format: dinero },
            { key: 'porcentaje', label: '% de pagos', numeric: true, format: value => `${value.toFixed(2)}%` }
        ]} rows={(data.proveedores ?? []).map(row => ({ ...row, porcentaje: Number(data.pagos_proveedores) ? Number(row.importe)*100/Number(data.pagos_proveedores) : 0 }))} totals={{ importe: data.pagos_proveedores }} /></section>
        <p className="resumen-nota">{criterioMensual}</p>
        <p className="resumen-nota">Remuneraciones automáticas hasta {data.remuneraciones_hasta}. Los días posteriores aún no están completos.</p>
        {(data.choferes_sin_fecha > 0 || data.dias_pendientes > 0) && <p className="resumen-aviso" role="alert">El resultado puede estar incompleto: {data.choferes_sin_fecha} choferes sin fecha de inicio de trabajo y {data.dias_pendientes} días de remuneración pendientes de cálculo. Revisa la consulta de remuneraciones.</p>}
    </>;
}
export function CuentasContenido({ data, print = false }) {
    return <>
        <Kpis items={[
            ['Total por cobrar', dinero(data.total_pendiente)], ['Saldo vencido', dinero(data.total_vencido)],
            ['Facturas pendientes', data.cantidad_facturas], ['Empresas con deuda', data.cantidad_clientes]
        ]} />
        <section className="resumen-panel"><h2>Saldo por empresa</h2>
            <TablaInforme columns={columnasClientes} rows={data.clientes} totals={{ saldo: data.total_pendiente, vencido: data.total_vencido, cantidad_facturas: data.cantidad_facturas }} empty="No hay facturas pendientes de cobro." />
        </section>
        <p className="resumen-nota">Saldo actual de todas las facturas vigentes: neto cobrable menos cobros registrados y pagos previos reconocidos. Los abonos no se reparten entre gasolineras. Incluye abonos parciales; excluye anulaciones. Una factura sin fecha de vencimiento no se marca como vencida.</p>
        {data.clientes.map(cliente => print ? <section key={cliente.id_empresa}>
            <h3>{cliente.empresa} · Pendiente: {dinero(cliente.saldo)}</h3><FacturasEmpresa facturas={cliente.facturas} print={print} />
        </section> : <details className="resumen-panel resumen-cliente" key={cliente.id_empresa}>
            <summary>{cliente.empresa}<span>{cliente.cantidad_facturas} facturas · {dinero(cliente.saldo)}</span></summary>
            <FacturasEmpresa facturas={cliente.facturas} print={print} />
        </details>)}
    </>;
}

function DetalleFacturaCuenta({ factura }) {
    return <>
        {factura.historico && <p className="resumen-nota">Documento histórico · {factura.archivo_origen} · {factura.hoja_origen}, fila {factura.fila_origen}. Sin liquidaciones del sistema.</p>}
        {Number(factura.importe_pagado_previo)>0 && <p>Pagado antes del período migrado: <strong>{dinero(factura.importe_pagado_previo)}</strong></p>}
        <h4>Cobros de la factura</h4>
        <TablaInforme columns={[
            { key: 'fecha', label: 'Fecha' }, { key: 'comprobante', label: 'Comprobante' },
            { key: 'estado', label: 'Estado' }, { key: 'importe', label: 'Importe', numeric: true, format: dinero }
        ]} rows={factura.cobros ?? []} empty="Sin cobros registrados en el sistema." />
        {!factura.historico && <>
            <h4>Liquidaciones por gasolinera</h4>
            <TablaInforme columns={[
                { key: 'id_liquidacion', label: 'Liquidación' }, { key: 'gasolinera', label: 'Gasolinera' },
                { key: 'desde', label: 'Desde' }, { key: 'hasta', label: 'Hasta' },
                { key: 'total', label: 'Neto liquidado', numeric: true, format: dinero }
            ]} rows={factura.liquidaciones ?? []} />
        </>}
    </>;
}
function FacturasEmpresa({ facturas, print }) {
    return <>
        <TablaInforme columns={columnasFacturas} rows={facturas} totals={{
            valor_neto: facturas.reduce((s,f) => s+Number(f.valor_neto),0),
            cobrado: facturas.reduce((s,f) => s+Number(f.cobrado),0),
            saldo: facturas.reduce((s,f) => s+Number(f.saldo),0)
        }} />
        {facturas.map(factura => print ? <section key={factura.id_factura}>
            <h4>Factura {factura.numero_factura}</h4><DetalleFacturaCuenta factura={factura} />
        </section> : <details className="resumen-panel" key={factura.id_factura}>
            <summary>Factura {factura.numero_factura} · Cobros y liquidaciones</summary>
            <DetalleFacturaCuenta factura={factura} />
        </details>)}
    </>;
}
