import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './tarifas.fields.js';
import { columns } from './tarifas.columns.js';
import { page } from './tarifas.config.js';
import { actions } from './tarifas.actions.js';
import { filters } from './tarifas.filters.js';

export function TarifasPage(props) {
    return <CatalogoPage {...page} fields={fields} columns={columns} actions={actions} filters={filters} {...props} />;
}
