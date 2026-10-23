import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './mantenimiento.fields.js';
import { columns } from './mantenimiento.columns.js';
import { page } from './mantenimiento.config.js';
import { actions } from './mantenimiento.actions.js';
import { filters } from './mantenimiento.filters.js';

export function MantenimientoPage(props) {
    return <CatalogoPage {...page} fields={fields} columns={columns} actions={actions} filters={filters} {...props} />;
}
