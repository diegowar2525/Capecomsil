import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './inventario.fields.js';
import { columns } from './inventario.columns.js';
import { page } from './inventario.config.js';
import { actions } from './inventario.actions.js';
import { filters } from './inventario.filters.js';

export function InventarioPage(props) {
    return <CatalogoPage {...page} fields={fields} columns={columns} actions={actions} filters={filters} {...props} />;
}
