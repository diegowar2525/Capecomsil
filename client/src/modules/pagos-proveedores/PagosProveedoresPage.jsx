import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './pagos-proveedores.fields.js';
import { columns } from './pagos-proveedores.columns.js';
import { page } from './pagos-proveedores.config.js';
import { actions } from './pagos-proveedores.actions.js';
import { filters } from './pagos-proveedores.filters.js';

export function PagosProveedoresPage(props) {
    return <CatalogoPage {...page} fields={fields} columns={columns} actions={actions} filters={filters} {...props} />;
}
