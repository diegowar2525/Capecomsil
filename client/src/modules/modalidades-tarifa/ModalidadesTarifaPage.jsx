import { filters } from './modalidades-tarifa.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './modalidades-tarifa.fields.js';
import { columns } from './modalidades-tarifa.columns.js';
import { page } from './modalidades-tarifa.config.js';
import { actions as declaredActions } from './modalidades-tarifa.actions.js';
import { api } from './services/modalidades-tarifa.api.js';
import { prepare } from './domain/modalidades-tarifa.js';
import { useModalidadesTarifa } from './hooks/useModalidadesTarifa.js';
const permissions = { annul: 'tarifas.anular', finish: 'mantenimientos.finalizar', fulfill: 'mantenimientos.registrar_cumplimientos', payments: 'pagos_proveedor.consultar', receipts: 'recepciones.consultar', pending: 'recepciones.consultar', receive: 'recepciones.crear' };
const actions = declaredActions.map(action => ({ ...action, permission: permissions[action.id] ?? action.permission }));
const definition = { filters, fields, columns, page, actions, api, prepare, rowKey: page.rowKey, permissionResource: 'tarifas', createPermission: 'tarifas.editar', };
export function ModalidadesTarifaPage() {
    return <CatalogoConectado definition={definition} controller={useModalidadesTarifa()} />;
}
