import { CatalogoForm } from '../../../components/CatalogoConectado/CatalogoForm.jsx';
import { useOpcionesDependientes } from '../../../hooks/useOpcionesDependientes.js';
import { fields } from '../liquidaciones.fields.js';
import { api } from '../services/liquidaciones.api.js';
import { SelectorEntregas } from './SelectorEntregas.jsx';
const cargar = async (values, signal) => {
 const resultado = await api.disponibles(values, signal);
 return resultado.entregas;
};
export function LiquidacionForm({ form, registro, catalogos, action, saving }) {
 const { id_gasolinera, periodo_inicio, periodo_fin } = form.values;
 const key = id_gasolinera && periodo_inicio && periodo_fin ? JSON.stringify({ id_gasolinera, periodo_inicio, periodo_fin, ...(registro ? { id_liquidacion: registro.id_liquidacion } : {}) }) : null;
 const state = useOpcionesDependientes(cargar, key);
 const manual = action.id === 'edit' || form.values.seleccion_entregas === 'MANUAL';
 const change = event => {
  if (['id_gasolinera', 'periodo_inicio', 'periodo_fin'].includes(event.target.name)) form.change({ target: { name: 'id_detalles_viaje', value: [] } });
  form.change(event);
 };
 return <>
  {!manual && state.loading && <p role="status">Consultando entregas disponibles…</p>}
  {!manual && state.error && <p role="alert">{state.error}</p>}
  <CatalogoForm fields={(action.fields ?? fields).filter(field => field.name !== 'id_detalles_viaje')} values={form.values} change={change} saving={saving} catalogos={catalogos} />
  {manual && <SelectorEntregas entregas={state.data} seleccion={form.values.id_detalles_viaje ?? []}
   onChange={value => form.change({ target: { name: 'id_detalles_viaje', value } })}
   disabled={saving} loading={state.loading} error={state.error} ready={Boolean(key)} />}
 </>;
}
