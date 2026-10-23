import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './feriados.fields.js';
import { columns } from './feriados.columns.js';
import { page } from './feriados.config.js';
import { actions } from './feriados.actions.js';
import { filters } from './feriados.filters.js';

export function FeriadosPage(props) {
    return <CatalogoPage {...page} fields={fields} columns={columns} actions={actions} filters={filters} {...props} />;
}
