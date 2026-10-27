import { filters } from './feriados.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './feriados.fields.js';
import { columns } from './feriados.columns.js';
import { page } from './feriados.config.js';
import { api } from './services/feriados.api.js';
import { prepare } from './domain/feriados.js';
import { useFeriados } from './hooks/useFeriados.js';
const definition = { filters, fields, columns, page, api, prepare, rowKey: page.rowKey, permissionResource: 'configuraciones' };
export function FeriadosPage() {
    return <CatalogoConectado definition={definition} controller={useFeriados()} />;
}
