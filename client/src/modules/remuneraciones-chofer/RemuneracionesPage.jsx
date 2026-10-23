import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './remuneraciones-chofer.fields.js';
import { columns } from './remuneraciones-chofer.columns.js';
import { page } from './remuneraciones-chofer.config.js';
import { actions } from './remuneraciones-chofer.actions.js';
import { filters } from './remuneraciones-chofer.filters.js';

export function RemuneracionesPage(props) {
    return <CatalogoPage {...page} fields={fields} columns={columns} actions={actions} filters={filters} {...props} />;
}
