import { filters } from './configuraciones-peaje-trayecto.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './configuraciones-peaje-trayecto.fields.js';
import { columns } from './configuraciones-peaje-trayecto.columns.js';
import { page } from './configuraciones-peaje-trayecto.config.js';
import { actions as declaredActions } from './configuraciones-peaje-trayecto.actions.js';
import { api } from './services/configuraciones-peaje-trayecto.api.js';
import { prepare } from './domain/configuraciones-peaje-trayecto.js';
import { useConfiguracionesPeaje } from './hooks/useConfiguracionesPeaje.js';
const permissions = { annul: 'configuraciones.anular', finish: 'mantenimientos.finalizar', fulfill: 'mantenimientos.registrar_cumplimientos', payments: 'pagos_proveedor.consultar', receipts: 'recepciones.consultar', pending: 'recepciones.consultar', receive: 'recepciones.crear' };
const actions = declaredActions.map(action => ({ ...action, permission: permissions[action.id] ?? action.permission }));
const definition = { filters, fields, columns, page, actions, api, prepare, rowKey: page.rowKey, permissionResource: 'configuraciones',  };
export function ConfiguracionesPeajePage() {
    return <CatalogoConectado definition={definition} controller={useConfiguracionesPeaje()} />;
}
