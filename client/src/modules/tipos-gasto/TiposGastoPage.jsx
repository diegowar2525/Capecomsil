import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { crudActions } from '../../components/CatalogoConectado/catalogo.actions.js';
import { fields } from './tipos-gasto.fields.js';
import { columns } from './tipos-gasto.columns.js';
import { filters } from './tipos-gasto.filters.js';
import { api } from './services/tipos-gasto.api.js';
import { prepare } from './domain/tipos-gasto.js';
import { useTiposGasto } from './hooks/useTiposGasto.js';
const definition = {
    page: {
        title: 'Tipos de gasto operativo',
        subtitle: 'Catálogo para clasificar los gastos operativos',
        actionLabel: 'Nuevo tipo de gasto'
    },
    fields,
    columns,
    filters,
    api,
    prepare,
    rowKey: 'id_tipo_gasto',
    actions: crudActions,
    formMessage:
        'Clasificaciones para gastos generales. Los viáticos, abastecimientos y pagos al taller se registran mediante sus opciones específicas.'
};
export function TiposGastoPage() {
    return <CatalogoConectado definition={definition} controller={useTiposGasto()} />;
}
