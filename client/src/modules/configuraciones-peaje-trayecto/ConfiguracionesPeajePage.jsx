import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './configuraciones-peaje-trayecto.fields.js';
import { columns } from './configuraciones-peaje-trayecto.columns.js';
import { page } from './configuraciones-peaje-trayecto.config.js';
import { actions } from './configuraciones-peaje-trayecto.actions.js';
import { filters } from './configuraciones-peaje-trayecto.filters.js';

export function ConfiguracionesPeajePage(props) {
    return <CatalogoPage {...page} fields={fields} columns={columns} actions={actions} filters={filters} {...props} />;
}
