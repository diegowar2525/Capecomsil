import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './informes.fields.js';
import { columns } from './informes.columns.js';
import { page } from './informes.config.js';
import { actions } from './informes.actions.js';
import { filters } from './informes.filters.js';

export function InformesPage(props) {
    return <CatalogoPage {...page} fields={fields} columns={columns} actions={actions} filters={filters} {...props} />;
}
