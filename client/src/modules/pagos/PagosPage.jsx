import { CatalogosInlineForm } from '../../components/CatalogoConectado/CatalogosInlineForm.jsx';
import { crearCatalogoApi } from '../../services/catalogo.api.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { page } from './pagos.config.js';
import { fields } from './pagos.fields.js';
import { columns } from './pagos.columns.js';
import { filters } from './pagos.filters.js';
import { actions } from './pagos.actions.js';
import { api } from './services/pagos.api.js';
import { prepare } from './domain/pagos.js';
import { usePagos } from './hooks/usePagos.js';
const descriptors = [{ name: 'id_banco', label: 'Banco', api: crearCatalogoApi('/api/bancos') }];
const detailFields = [
    ...fields.map(field => field.name === 'id_banco' ? { name: 'banco', label: 'Banco' } : field),
    { name: 'motivo_anulacion', label: 'Motivo de anulación', type: 'textarea' },
    { name: 'fecha_anulacion', label: 'Fecha de anulación' }
];
const definition = {
    detailFields,
    renderForm: props => <CatalogosInlineForm {...props} fields={fields} descriptors={descriptors} />,
    page,
    fields,
    columns,
    filters,
    actions,
    api,
    prepare,
    rowKey: page.rowKey,
    permissionResource: 'cobros_cliente'
};
export function PagosPage() {
    return <CatalogoConectado definition={definition} controller={usePagos()} />;
}
