import { CatalogoForm } from '../../../components/CatalogoConectado/CatalogoForm.jsx';
import { fields } from '../facturacion.fields.js';
import '../../../styles/modules/liquidaciones.css';

export function FacturaClienteForm({ form, catalogos, saving }) {
    const disponibles = (catalogos.id_liquidaciones ?? []).filter(option =>
        !option.disabled && String(option.registro.id_empresa) === String(form.values.id_empresa));
    const seleccion = new Set((form.values.id_liquidaciones ?? []).map(String));
    const elegidas = disponibles.filter(option => seleccion.has(option.value));
    const set = value => form.change({ target: { name: 'id_liquidaciones', value } });
    const change = event => {
        if (event.target.name === 'id_empresa') set([]);
        form.change(event);
    };
    const dinero = value => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(value);
    return <>
        <CatalogoForm fields={fields.filter(field => field.name !== 'id_liquidaciones')}
            values={form.values} change={change} saving={saving} catalogos={catalogos} />
        <section className="selector-entregas" aria-label="Liquidaciones confirmadas">
            <header className="selector-entregas__header"><h3>Liquidaciones confirmadas</h3>
                <span>{elegidas.length} seleccionadas</span></header>
            {!form.values.id_empresa ? <p>Selecciona la empresa para ver sus liquidaciones disponibles.</p>
                : !disponibles.length ? <p>No hay liquidaciones confirmadas disponibles para esta empresa.</p>
                : <>
                    <div className="selector-entregas__acciones">
                        <button type="button" className="btn btn-outline" disabled={saving} onClick={() => set(disponibles.map(o => o.value))}>Seleccionar todas</button>
                        <button type="button" className="btn btn-outline" disabled={saving} onClick={() => set([])}>Limpiar selección</button>
                    </div>
                    <div className="selector-entregas__lista">{disponibles.map(option => <label key={option.value}
                        className={`selector-entregas__item${seleccion.has(option.value) ? ' is-selected' : ''}`}>
                        <input type="checkbox" disabled={saving} checked={seleccion.has(option.value)}
                            onChange={event => set(event.target.checked ? [...seleccion, option.value] : [...seleccion].filter(id => id !== option.value))} />
                        <span>{option.label}</span>
                    </label>)}</div>
                </>}
            <footer className="selector-entregas__resumen"><span>Total neto de la factura</span>
                <strong>{dinero(elegidas.reduce((sum, option) => sum + Number(option.registro.total_liquidacion), 0))}</strong></footer>
        </section>
    </>;
}
