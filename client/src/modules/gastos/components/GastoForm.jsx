import { useState } from 'react';
import { CatalogoForm } from '../../../components/CatalogoConectado/CatalogoForm.jsx';
import { FormField } from '../../../components/FormField/FormField.jsx';
import { useOpcionesDependientes } from '../../../hooks/useOpcionesDependientes.js';
import { consultarViaticos } from '../services/gastos.api.js';
import { fields } from '../gastos.fields.js';
export function GastoForm({ form, catalogos, saving }) {
 const [fechaViatico,setFechaViatico] = useState('');
 const fecha = fechaViatico || form.values.fecha;
 const esViatico = form.values.tipo_gasto === 'VIATICO';
 const state = useOpcionesDependientes(consultarViaticos, esViatico && fecha ? JSON.stringify({ fecha }) : null);
 const limpiarViatico = () => form.change({target:{name:'id_viatico_chofer',value:''}});
 const change = event => {
  if (['fecha','tipo_gasto'].includes(event.target.name)) limpiarViatico();
  if(event.target.name==='tipo_gasto' && event.target.value==='VIATICO') form.change({target:{name:'id_viaje',value:''}});
  form.change(event);
 };
 const displayFields = fields.map(field => ({
  ...field,
  label: field.required ? field.label : `${field.label} (opcional)`,
  ...(field.name === 'id_viaje' ? { disabled: esViatico } : {})
 }));
 return <>
 {esViatico && <>
  <FormField name="fecha_consulta_viatico" label="Fecha del viático a consultar (opcional)" type="date" value={fecha || ''} disabled={saving} onChange={event=>{setFechaViatico(event.target.value);limpiarViatico();}}/>
  <p>Por defecto se usa la fecha del gasto. Puede consultar otro día si registra el gasto después del viaje.</p>
  {!fecha && <p role="status">Seleccione la fecha para consultar los viáticos.</p>}
  {state.loading && <p role="status">Cargando viáticos…</p>}
  {state.error && <p role="alert">No se pudieron consultar los viáticos: {state.error}</p>}
  {fecha && !state.loading && !state.error && state.data.length===0 && <p role="status">No hay viáticos generados para esta fecha. Se generan al registrar viajes con configuración de viáticos vigente.</p>}
 </>}
 <CatalogoForm fields={displayFields} values={form.values} change={change} saving={saving} catalogos={{ ...catalogos, id_viatico_chofer: state.data.map(row => ({ value: String(row.id_viatico_chofer), label: `${row.nombre} · ${row.fecha} · ${row.estimado}` })) }} />
 </>;
}
