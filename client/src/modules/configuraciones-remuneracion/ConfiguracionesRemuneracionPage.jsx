import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './configuraciones-remuneracion.fields.js';
import { columns } from './configuraciones-remuneracion.columns.js';
import { page } from './configuraciones-remuneracion.config.js';
import { actions } from './configuraciones-remuneracion.actions.js';
import { filters } from './configuraciones-remuneracion.filters.js';

export function ConfiguracionesRemuneracionPage(props) {
    return <CatalogoPage {...page} fields={fields} columns={columns} actions={actions} filters={filters} {...props} />;
}
