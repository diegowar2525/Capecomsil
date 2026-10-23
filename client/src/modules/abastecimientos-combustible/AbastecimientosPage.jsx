import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './abastecimientos-combustible.fields.js';
import { columns } from './abastecimientos-combustible.columns.js';
import { page } from './abastecimientos-combustible.config.js';
import { actions } from './abastecimientos-combustible.actions.js';
import { filters } from './abastecimientos-combustible.filters.js';

export function AbastecimientosPage(props) {
    return <CatalogoPage {...page} fields={fields} columns={columns} actions={actions} filters={filters} {...props} />;
}
