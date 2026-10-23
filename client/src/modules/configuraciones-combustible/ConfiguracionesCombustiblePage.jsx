import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './configuraciones-combustible.fields.js';
import { columns } from './configuraciones-combustible.columns.js';
import { page } from './configuraciones-combustible.config.js';
import { actions } from './configuraciones-combustible.actions.js';
import { filters } from './configuraciones-combustible.filters.js';

export function ConfiguracionesCombustiblePage(props) {
    return <CatalogoPage {...page} fields={fields} columns={columns} actions={actions} filters={filters} {...props} />;
}
