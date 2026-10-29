import { filters } from './viajes.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { ViajeOperacionForm } from './components/ViajeOperacionForm.jsx';
import { columns } from './viajes.columns.js';
import { actions as declaredActions } from './viajes.actions.js';
import { api } from './services/viajes.api.js';
import { useViajes } from './hooks/useViajes.js';

const actions = declaredActions.map(action => ({ ...action, permission: `viajes.${({ edit: 'editar', annul: 'anular' })[action.id] ?? 'consultar'}` }));
const definition = {
    filters,
    page: {
        title: 'Gestión de viajes',
        subtitle: 'Despachos, entregas y recorrido automático',
        actionLabel: 'Registrar viaje'
    },
    columns,
    actions,
    api,
    fields: [],
    rowKey: 'id_viaje',
    permissionResource: 'viajes',
    Form: ViajeOperacionForm
};
export function Viajes() { return <CatalogoConectado definition={definition} controller={useViajes()} />; }
