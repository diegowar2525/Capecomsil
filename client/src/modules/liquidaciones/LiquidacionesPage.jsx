import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './liquidaciones.fields.js';
import { columns } from './liquidaciones.columns.js';
import { page } from './liquidaciones.config.js';
import { actions } from './liquidaciones.actions.js';
import { filters } from './liquidaciones.filters.js';

export function LiquidacionesPage(props) {
    return <CatalogoPage {...page} fields={fields} columns={columns} actions={actions} filters={filters} {...props} />;
}
