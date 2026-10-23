import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './recepciones-compra.fields.js';
import { columns } from './recepciones-compra.columns.js';
import { page } from './recepciones-compra.config.js';
import { actions } from './recepciones-compra.actions.js';
import { filters } from './recepciones-compra.filters.js';

export function RecepcionesCompraPage(props) {
    return <CatalogoPage {...page} fields={fields} columns={columns} actions={actions} filters={filters} {...props} />;
}
