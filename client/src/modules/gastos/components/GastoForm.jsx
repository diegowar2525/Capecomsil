import { useState } from 'react';
import { CatalogoForm } from '../../../components/CatalogoConectado/CatalogoForm.jsx';
import { FormField } from '../../../components/FormField/FormField.jsx';
import { useOpcionesDependientes } from '../../../hooks/useOpcionesDependientes.js';
import { consultarViaticos } from '../services/gastos.api.js';
import { fields } from '../gastos.fields.js';

export function GastoForm({ form, catalogos, saving }) {
    const [fechaViatico, setFechaViatico] = useState('');
    const esViatico = form.values.origen === 'VIATICO';
    const state = useOpcionesDependientes(consultarViaticos, esViatico && fechaViatico ? JSON.stringify({ fecha: fechaViatico }) : null);
    const limpiarViatico = () => form.change({ target: { name: 'id_viatico_chofer', value: '' } });
    const change = event => {
        if (event.target.name === 'origen') {
            limpiarViatico();
            for (const name of ['id_tipo_gasto', 'id_viaje', 'id_vehiculo']) form.change({ target: { name, value: '' } });
        }
        form.change(event);
    };
    const viatico = state.data.find(row => String(row.id_viatico_chofer) === String(form.values.id_viatico_chofer));
    const displayFields = fields.filter(field => !['origen','id_viatico_chofer'].includes(field.name));
    return <>
        <CatalogoForm fields={fields.filter(field => field.name === 'origen')} values={form.values} change={change} saving={saving} />
        {esViatico && <fieldset className="form-section">
            <legend>Viático del chofer</legend>
            <p>Selecciona el día trabajado y el chofer. Después registra la fecha y el dinero realmente entregado; puede ser diferente del estimado.</p>
            <div className="form-grid">
                <FormField name="fecha_consulta_viatico" label="Día del viático" type="date" required value={fechaViatico} disabled={saving}
                    onChange={event => { setFechaViatico(event.target.value); limpiarViatico(); }} />
                <FormField name="id_viatico_chofer" label="Chofer y viático diario" type="select" required
                    value={form.values.id_viatico_chofer ?? ''} disabled={saving || state.loading || !fechaViatico}
                    options={state.data.map(row => ({ value: String(row.id_viatico_chofer), label: row.nombre + ' · Estimado $' + row.estimado }))} onChange={change} />
            </div>
            {state.loading && <p role="status">Consultando viáticos…</p>}
            {state.error && <p role="alert">{state.error}</p>}
            {fechaViatico && !state.loading && !state.error && !state.data.length && <p role="status">No hay viáticos generados para ese día. Comprueba los viajes del chofer.</p>}
            {viatico && <p role="status">Estimado: $ {viatico.estimado} · Desembolsado anteriormente: $ {viatico.gasto_real_registrado ?? '0.00'}</p>}
        </fieldset>}
        <CatalogoForm fields={displayFields} values={form.values} change={change} saving={saving} catalogos={catalogos} />
    </>;
}
