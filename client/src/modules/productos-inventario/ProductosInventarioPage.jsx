import { filters } from './productos-inventario.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './productos-inventario.fields.js';
import { columns } from './productos-inventario.columns.js';
import { page } from './productos-inventario.config.js';
import { api } from './services/productos-inventario.api.js';
import { prepare, formFields } from './domain/productos-inventario.js';
import { useProductosInventario } from './hooks/useProductosInventario.js';

const definition = { filters, fields, columns, page, api, prepare, rowKey: 'id_producto', formFields };

export function ProductosInventarioPage() {
    const controller = useProductosInventario();
    return <CatalogoConectado definition={definition} controller={controller} />;
}
