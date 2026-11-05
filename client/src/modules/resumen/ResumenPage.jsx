import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { InformeImpresion } from '../../components/InformeImpresion/InformeImpresion.jsx';
import { MensualContenido, CuentasContenido } from './components/ResumenContenido.jsx';
import { mesActual, nombreMes } from './domain/resumen.js';
import { useResumen } from './hooks/useResumen.js';

function VistaResumen({ view, mes, onMonth }) {
    const { data, error, loading, refresh } = useResumen(view, mes);
    const monthly = view === 'mensual';
    const title = monthly ? 'Resumen mensual' : 'Cuentas por cobrar';
    const subtitle = monthly ? nombreMes(mes) : 'Saldo acumulado actual';
    const content = data && (monthly ? <MensualContenido data={data} /> : <CuentasContenido data={data} />);
    return <div>
        <div className="resumen-toolbar">
            {monthly ? <label className="resumen-mes">Mes del informe<input type="month" min="1900-01" max="2199-12" value={mes} onChange={event => { if (/^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(event.target.value)) onMonth(event.target.value); }} /></label> : <p>Saldo acumulado de todos los períodos</p>}
            <div className="resumen-toolbar-actions"><button type="button" className="btn btn-outline" onClick={refresh} disabled={loading}><RefreshCw size={16} aria-hidden="true" />Actualizar</button>
                <InformeImpresion title={title} subtitle={subtitle} generatedAt={data?.generado_en} disabled={loading || !data || Boolean(error)}>
                    {data && (monthly ? <MensualContenido data={data} /> : <CuentasContenido data={data} print />)}
                </InformeImpresion></div>
        </div>
        {loading && <p role="status">Cargando resumen…</p>}
        {error && <p role="alert" className="resumen-aviso">{error}</p>}
        {!loading && !error && content}
        {data && <p className="resumen-actualizado">Actualizado: {data.generado_en.replace('T', ' · ')} · Ecuador. En la ventana de impresión puedes elegir «Guardar como PDF».</p>}
    </div>;
}
export function ResumenPage() {
    const [view, setView] = useState('mensual');
    const [mes, setMes] = useState(mesActual);
    return <section className="resumen-page">
        <PageHeader title="Resumen" subtitle="Ingresos por viajes, costos y cuentas pendientes de Capecomsil" />
        <div className="resumen-tabs" aria-label="Vistas del resumen">
            {[['mensual', 'Resumen mensual'], ['cuentas', 'Cuentas por cobrar']].map(([id, label]) => <button type="button" key={id} aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}
        </div>
        <VistaResumen key={`${view}-${mes}`} view={view} mes={mes} onMonth={setMes} />
    </section>;
}
