import { filters } from './configuraciones-combustible.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './configuraciones-combustible.fields.js';
import { columns } from './configuraciones-combustible.columns.js';
import { page } from './configuraciones-combustible.config.js';
import { api } from './services/configuraciones-combustible.api.js';
import { prepare } from './domain/configuraciones-combustible.js';
import { useConfiguracionesCombustible } from './hooks/useConfiguracionesCombustible.js';
const definition = { filters, fields, columns, page, api, prepare, rowKey: page.rowKey, permissionResource: 'configuraciones' };
export function ConfiguracionesCombustiblePage() {
    return <CatalogoConectado definition={definition} controller={useConfiguracionesCombustible()} />;
}
