import { filters } from './configuraciones-remuneracion.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './configuraciones-remuneracion.fields.js';
import { columns } from './configuraciones-remuneracion.columns.js';
import { page } from './configuraciones-remuneracion.config.js';
import { api } from './services/configuraciones-remuneracion.api.js';
import { prepare } from './domain/configuraciones-remuneracion.js';
import { useConfiguracionesRemuneracion } from './hooks/useConfiguracionesRemuneracion.js';
const definition = { filters, fields, columns, page, api, prepare, rowKey: page.rowKey, permissionResource: 'configuraciones' };
export function ConfiguracionesRemuneracionPage() {
    return <CatalogoConectado definition={definition} controller={useConfiguracionesRemuneracion()} />;
}
