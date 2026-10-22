import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './productos.fields.js';
import { columns } from './productos.columns.js';
import { page } from './productos.config.js';

export function ProductosPage() {
    return <CatalogoPage rowKey="id_producto_transportado" {...page} columns={columns} fields={fields} />;
}
