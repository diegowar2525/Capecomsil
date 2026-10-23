import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './trayectos.fields.js';
import { columns } from './trayectos.columns.js';
import { page } from './trayectos.config.js';
import { actions } from './trayectos.actions.js';
import { filters } from './trayectos.filters.js';

export function TrayectosPage({ data = [], ...props }) {
    const rows = data.map((row) => ({ ...row,
        tipo_origen: row.id_terminal_origen ? 'TERMINAL' : 'GASOLINERA',
        tipo_destino: row.id_terminal_destino ? 'TERMINAL' : 'GASOLINERA'
    }));
    return <CatalogoPage {...page} fields={fields} columns={columns} actions={actions} filters={filters} data={rows} {...props} />;
}
