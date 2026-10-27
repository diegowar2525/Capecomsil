import { filters } from './configuraciones-viatico.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './configuraciones-viatico.fields.js';
import { columns } from './configuraciones-viatico.columns.js';
import { page } from './configuraciones-viatico.config.js';
import { api } from './services/configuraciones-viatico.api.js';
import { prepare } from './domain/configuraciones-viatico.js';
import { useConfiguracionesViatico } from './hooks/useConfiguracionesViatico.js';
const definition = { filters, fields, columns, page, api, prepare, rowKey: page.rowKey, permissionResource: 'configuraciones' };

export function ConfiguracionesViaticoPage() {
    return <CatalogoConectado definition={definition} controller={useConfiguracionesViatico()} />;
}
