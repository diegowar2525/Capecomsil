import { CatalogoForm } from '../../../components/CatalogoConectado/CatalogoForm.jsx';
import { useOpcionesDependientes } from '../../../hooks/useOpcionesDependientes.js';
import { consultarViaticos } from '../services/gastos.api.js';
import { fields } from '../gastos.fields.js';
export function GastoForm({ form, catalogos, saving }) {
 const fecha = form.values.fecha;
 const state = useOpcionesDependientes(consultarViaticos, fecha ? JSON.stringify({ fecha }) : null);
 const change = event => {
  if (event.target.name === 'fecha') form.change({ target: { name: 'id_viatico_chofer', value: '' } });
  form.change(event);
 };
 return <>{state.error && <p role="alert">No se pudieron consultar los viáticos: {state.error}</p>}
 <CatalogoForm fields={fields} values={form.values} change={change} saving={saving} catalogos={{ ...catalogos, id_viatico_chofer: state.data.map(row => ({ value: String(row.id_viatico_chofer), label: `${row.nombre} · ${row.fecha} · ${row.estimado}` })) }} /></>;
}
