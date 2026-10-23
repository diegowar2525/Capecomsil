import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './configuraciones-viatico.fields.js';
import { columns } from './configuraciones-viatico.columns.js';
import { page } from './configuraciones-viatico.config.js';
import { actions } from './configuraciones-viatico.actions.js';
import { filters } from './configuraciones-viatico.filters.js';

export function ConfiguracionesViaticoPage(props) {
    return <CatalogoPage {...page} fields={fields} columns={columns} actions={actions} filters={filters} {...props} />;
}
