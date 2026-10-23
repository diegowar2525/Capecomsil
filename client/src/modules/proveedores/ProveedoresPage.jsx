import { crudActions } from '../../components/CatalogoPage/catalogo.actions.js';
import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './proveedores.fields.js';
import { columns } from './proveedores.columns.js';
import { page } from './proveedores.config.js';

import { relatedAction } from './proveedores.actions.js';

export function ProveedoresPage() {
    return <CatalogoPage rowKey="id_proveedor" {...page} columns={columns} fields={fields} actions={[...crudActions, relatedAction]} />;
}
