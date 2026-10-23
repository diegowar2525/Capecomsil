import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './productos-inventario.fields.js';
import { columns } from './productos-inventario.columns.js';
import { page } from './productos-inventario.config.js';
import { actions } from './productos-inventario.actions.js';
import { filters } from './productos-inventario.filters.js';

export function ProductosInventarioPage(props) {
    return <CatalogoPage {...page} fields={fields} columns={columns} actions={actions} filters={filters} {...props} />;
}
