import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './proveedores.fields.js';
import { columns } from './proveedores.columns.js';
import { page } from './proveedores.config.js';

export function ProveedoresPage() {
    return <CatalogoPage rowKey="id_proveedor" {...page} columns={columns} fields={fields} />;
}
