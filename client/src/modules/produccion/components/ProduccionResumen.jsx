import { InformeImpresion, TablaInforme } from '../../../components/InformeImpresion/InformeImpresion.jsx';
import { dinero } from '../../resumen/domain/resumen.js';
import { columns } from '../produccion.columns.js';
import { matriz, totales } from '../domain/produccion.js';
export function ProduccionResumen({ data, params, options, loading, error }) {
    const title = 'Producción por vehículos y terminales';
    const selected = name => options?.[name]?.find(o => String(o.value) === String(params[name]))?.label;
    const subtitle = `${params.fecha_desde} — ${params.fecha_hasta} · ${params.id_vehiculo ? `Placa ${selected('id_vehiculo') ?? ''}` : 'General'}${params.id_terminal ? ` · ${selected('id_terminal') ?? ''}` : ''}`;
    const note = params.id_terminal ? 'Los costos y el margen se omiten al filtrar por terminal: un viaje puede cargar en varias terminales y no se reparte su costo arbitrariamente.' : 'Margen estimado = ingresos menos costos calculados de los viajes. No equivale al resultado mensual. El porcentaje corresponde al conjunto consultado.';
    return <>
        <InformeImpresion title={title} subtitle={subtitle} generatedAt={new Date().toLocaleString('sv-SE', { timeZone: 'America/Guayaquil' })} disabled={loading || Boolean(error)}>
            <p>{note}</p><TablaInforme columns={columns} rows={data} totals={totales(data)} /><ProduccionDesgloses data={data} />
        </InformeImpresion>
        <p className="resumen-nota">{note}</p>
    </>;
}

export function ProduccionDesgloses({ data, loading, error }) {
    if (loading || error) return null;
    const cruce = matriz(data);
    const matrixColumns = [{ key: 'placa', label: 'Placa' }, ...cruce.terminales.map(([id, label]) => ({ key: `terminal_${id}`, label, numeric: true, format: dinero })), { key: 'ingresos', label: 'Total', numeric: true, format: dinero }];
    const matrixTotals = Object.fromEntries(matrixColumns.slice(1).map(c => [c.key, cruce.rows.reduce((n, r) => n + Math.round(Number(r[c.key]) * 100), 0) / 100]));
    const content = <>
        <section className="resumen-panel"><h2>Ingresos por placa y terminal</h2><TablaInforme columns={matrixColumns} rows={cruce.rows} totals={matrixTotals} /></section>
        <section className="resumen-panel"><h2>Gasolineras atendidas</h2><TablaInforme columns={[{ key: 'placa', label: 'Placa' }, { key: 'gasolineras', label: 'Gasolineras' }]} rows={data} /></section>
    </>;
    return <div className="produccion-desgloses">{content}</div>;
}
