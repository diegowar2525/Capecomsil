import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { page } from './facturacion.config.js';
import { fields } from './facturacion.fields.js';
import { columns } from './facturacion.columns.js';
import { filters } from './facturacion.filters.js';
import { actions } from './facturacion.actions.js';
import { api } from './services/facturacion.api.js';
import { prepare } from './domain/facturacion.js';
import { useFacturacion } from './hooks/useFacturacion.js';
const detailFields = [...fields, { name: 'subtotal', label: 'Subtotal (transporte + recargo)' }, { name: 'retencion', label: 'Retención' }, { name: 'vencida', label: 'Vencida' }, { name: 'motivo_anulacion', label: 'Motivo de anulación', type: 'textarea' }, { name: 'fecha_anulacion', label: 'Fecha de anulación' }];
const definition = { detailFields, page, fields, columns, filters, actions, api, prepare, rowKey: page.rowKey, permissionResource: 'facturas_cliente' };
export function FacturacionPage() { return <CatalogoConectado definition={definition} controller={useFacturacion()} />; }
