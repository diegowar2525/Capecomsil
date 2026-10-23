import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './categorias-producto.fields.js';
import { columns } from './categorias-producto.columns.js';
import { page } from './categorias-producto.config.js';
import { actions } from './categorias-producto.actions.js';
import { filters } from './categorias-producto.filters.js';

export function CategoriasProductoPage(props) {
    return <CatalogoPage {...page} fields={fields} columns={columns} actions={actions} filters={filters} {...props} />;
}
