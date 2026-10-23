import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './planes-mantenimiento.fields.js';
import { columns } from './planes-mantenimiento.columns.js';
import { page } from './planes-mantenimiento.config.js';
import { actions } from './planes-mantenimiento.actions.js';
import { filters } from './planes-mantenimiento.filters.js';

export function PlanesMantenimientoPage(props) {
    return <CatalogoPage {...page} fields={fields} columns={columns} actions={actions} filters={filters} {...props} />;
}
