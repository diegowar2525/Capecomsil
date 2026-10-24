import { filters } from './proveedores.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './proveedores.fields.js';
import { columns } from './proveedores.columns.js';
import { page } from './proveedores.config.js';
import { api } from './services/proveedores.api.js';
import { prepare } from './domain/proveedores.js';
import { useProveedores } from './hooks/useProveedores.js';
import { crudActions } from '../../components/CatalogoPage/catalogo.actions.js';
import { relatedAction } from './proveedores.actions.js';
const actions = [...crudActions, relatedAction];

const definition = { filters, fields, columns, page, api, prepare, rowKey: 'id_proveedor', actions };

export function ProveedoresPage() {
    const controller = useProveedores();
    return <CatalogoConectado definition={definition} controller={controller} />;
}
