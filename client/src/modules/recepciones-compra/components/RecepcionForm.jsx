import { CatalogoForm } from '../../../components/CatalogoConectado/CatalogoForm.jsx';
import { useOpcionesDependientes } from '../../../hooks/useOpcionesDependientes.js';
import { fields } from '../recepciones-compra.fields.js';
import { api } from '../services/recepciones-compra.api.js';
const cargar = ({ id }, signal) => api.pendientes(id, signal);
export function RecepcionForm({ form, catalogos, saving }) {
 const id = form.values.id_factura_proveedor;
 const state = useOpcionesDependientes(cargar, id ? JSON.stringify({ id }) : null);
 const change = event => {
  if (event.target.name === 'id_factura_proveedor') form.change({ target: { name: 'detalles', value: [{ id_detalle_factura_proveedor: '', cantidad_recibida: '', observacion: '' }] } });
  form.change(event);
 };
 return <>
  {state.loading && <p role="status">Consultando productos pendientes…</p>}
  {state.error && <p role="alert">{state.error}</p>}
  <CatalogoForm fields={fields} values={form.values} change={change} saving={saving} catalogos={{ ...catalogos, id_detalle_factura_proveedor: state.data.map(row => ({ value: String(row.id_detalle_factura_proveedor), label: `${row.descripcion} (pendiente: ${row.pendiente_recibir})` })) }} />
 </>;
}
