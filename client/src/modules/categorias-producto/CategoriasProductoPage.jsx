import { filters } from './categorias-producto.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './categorias-producto.fields.js';
import { columns } from './categorias-producto.columns.js';
import { page } from './categorias-producto.config.js';
import { api } from './services/categorias-producto.api.js';
import { prepare } from './domain/categorias-producto.js';
import { useCategoriasProducto } from './hooks/useCategoriasProducto.js';

const definition = { filters, fields, columns, page, api, prepare, rowKey: 'id_categoria' };

export function CategoriasProductoPage() {
    const controller = useCategoriasProducto();
    return <CatalogoConectado definition={definition} controller={controller} />;
}
