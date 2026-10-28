import { filters } from './costos-viaje.filters.js';
import { ConsultaCatalogo } from '../../components/CatalogoConectado/ConsultaCatalogo.jsx';
import { columns } from './costos-viaje.columns.js';
import { api } from './services/costos-viaje.api.js';
const fields = [{ name: 'id_viaje', label: 'Viaje', type: 'select', source: 'id_viaje', required: true }];
const definition = { filters, page: { title: 'Costos de viaje', subtitle: 'Costos calculados por el servidor' }, columns, fields: [], actions: [], api, rowKey: 'id_costo', permissionResource: 'viajes' };
export function CostosViajePage() { return <ConsultaCatalogo definition={definition} fields={fields} />; }
