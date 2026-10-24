import { filters } from './productos.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './productos.fields.js';
import { columns } from './productos.columns.js';
import { page } from './productos.config.js';
import { api } from './services/productos.api.js';
import { prepare } from './domain/productos.js';
import { useProductos } from './hooks/useProductos.js';

const definition = { filters, fields, columns, page, api, prepare, rowKey: 'id_producto_transportado' };

export function ProductosPage() {
    const controller = useProductos();
    return <CatalogoConectado definition={definition} controller={controller} />;
}
