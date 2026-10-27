import { CatalogoForm } from '../../../components/CatalogoConectado/CatalogoForm.jsx';
import { useOpcionesDependientes } from '../../../hooks/useOpcionesDependientes.js';
import { fields } from '../liquidaciones.fields.js';
import { api } from '../services/liquidaciones.api.js';
const cargar = (values, signal) => api.disponibles(values, signal);
export function LiquidacionForm({ form, registro, catalogos, action, saving }) {
 const { id_gasolinera, periodo_inicio, periodo_fin } = form.values;
 const key = id_gasolinera && periodo_inicio && periodo_fin ? JSON.stringify({ id_gasolinera, periodo_inicio, periodo_fin, ...(registro ? { id_liquidacion: registro.id_liquidacion } : {}) }) : null;
 const state = useOpcionesDependientes(cargar, key);
 const change = event => {
  if (['id_gasolinera', 'periodo_inicio', 'periodo_fin'].includes(event.target.name)) form.change({ target: { name: 'id_detalles_viaje', value: [] } });
  form.change(event);
 };
 return <>
  {state.loading && <p role="status">Consultando entregas disponibles…</p>}
  {state.error && <p role="alert">{state.error}</p>}
  <CatalogoForm fields={action.fields ?? fields} values={form.values} change={change} saving={saving} catalogos={{ ...catalogos, id_detalles_viaje: state.data.map(row => ({ value: String(row.id_detalle_viaje), label: `Entrega ${row.id_detalle_viaje} · ${row.galones} galones` })) }} />
 </>;
}
