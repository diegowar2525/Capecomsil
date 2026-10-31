import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { page } from './pagos.config.js';
import { fields } from './pagos.fields.js';
import { columns } from './pagos.columns.js';
import { filters } from './pagos.filters.js';
import { actions } from './pagos.actions.js';
import { api } from './services/pagos.api.js';
import { prepare } from './domain/pagos.js';
import { usePagos } from './hooks/usePagos.js';
const detailFields = [...fields,  { name: 'motivo_anulacion', label: 'Motivo de anulación', type: 'textarea' }, { name: 'fecha_anulacion', label: 'Fecha de anulación' }];
const definition = { detailFields, page, fields, columns, filters, actions, api, prepare, rowKey: page.rowKey, permissionResource: 'cobros_cliente' };
export function PagosPage() { return <CatalogoConectado definition={definition} controller={usePagos()} />; }
