import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './gastos.fields.js';
import { columns } from './gastos.columns.js';
import { page } from './gastos.config.js';
import { actions } from './gastos.actions.js';
import { filters } from './gastos.filters.js';

export function GastosPage(props) {
    return <CatalogoPage {...page} fields={fields} columns={columns} actions={actions} filters={filters} {...props} />;
}
