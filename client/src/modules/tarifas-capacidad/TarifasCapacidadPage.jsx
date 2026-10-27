import { filters } from './tarifas-capacidad.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './tarifas-capacidad.fields.js';
import { columns } from './tarifas-capacidad.columns.js';
import { page } from './tarifas-capacidad.config.js';
import { actions as declaredActions } from './tarifas-capacidad.actions.js';
import { api } from './services/tarifas-capacidad.api.js';
import { prepare } from './domain/tarifas-capacidad.js';
import { useTarifasCapacidad } from './hooks/useTarifasCapacidad.js';
const permissions = { annul: 'tarifas.anular', finish: 'mantenimientos.finalizar', fulfill: 'mantenimientos.registrar_cumplimientos', payments: 'pagos_proveedor.consultar', receipts: 'recepciones.consultar', pending: 'recepciones.consultar', receive: 'recepciones.crear' };
const actions = declaredActions.map(action => ({ ...action, permission: permissions[action.id] ?? action.permission }));
const definition = { filters, fields, columns, page, actions, api, prepare, rowKey: page.rowKey, permissionResource: 'tarifas',  };
export function TarifasCapacidadPage() {
    return <CatalogoConectado definition={definition} controller={useTarifasCapacidad()} />;
}
