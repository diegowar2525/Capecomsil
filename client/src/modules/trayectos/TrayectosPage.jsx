import { filters } from './trayectos.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './trayectos.fields.js';
import { columns } from './trayectos.columns.js';
import { page } from './trayectos.config.js';
import { api } from './services/trayectos.api.js';
import { prepare, initial } from './domain/trayectos.js';
import { useTrayectos } from './hooks/useTrayectos.js';

const definition = { filters, fields, columns, page, api, prepare, rowKey: 'id_trayecto', initial };

export function TrayectosPage() {
    const controller = useTrayectos();
    return <CatalogoConectado definition={definition} controller={controller} />;
}
