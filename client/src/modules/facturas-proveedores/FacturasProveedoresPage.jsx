import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './facturas-proveedores.fields.js';
import { columns } from './facturas-proveedores.columns.js';
import { page } from './facturas-proveedores.config.js';
import { actions } from './facturas-proveedores.actions.js';
import { filters } from './facturas-proveedores.filters.js';

export function FacturasProveedoresPage(props) {
    return <CatalogoPage {...page} fields={fields} columns={columns} actions={actions} filters={filters} {...props} />;
}
