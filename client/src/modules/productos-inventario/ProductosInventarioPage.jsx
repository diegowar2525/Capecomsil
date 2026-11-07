import { MarcaModeloForm } from '../../components/MarcaModeloForm/MarcaModeloForm.jsx';
import { filters } from './productos-inventario.filters.js';
import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { fields } from './productos-inventario.fields.js';
import { columns } from './productos-inventario.columns.js';
import { page } from './productos-inventario.config.js';
import { api } from './services/productos-inventario.api.js';
import { prepare, formFields } from './domain/productos-inventario.js';
import { useProductosInventario } from './hooks/useProductosInventario.js';
import { fotoProductoApi } from '../../services/fotos.api.js';

const definition = {
    renderForm: (props) => (
        <MarcaModeloForm
            {...props}
            fields={formFields(props.form.values, props.catalogos)}
            ambito="PRODUCTO"
        />
    ),
    detailFields: [
        ...fields.filter((field) => !['id_marca', 'id_modelo'].includes(field.name)),
        { name: 'marca', label: 'Marca' },
        { name: 'modelo', label: 'Modelo' }
    ],
    filters,
    fields,
    columns,
    page,
    api,
    prepare,
    rowKey: 'id_producto',
    formFields,
    foto: fotoProductoApi
};

export function ProductosInventarioPage() {
    const controller = useProductosInventario();
    return <CatalogoConectado definition={definition} controller={controller} />;
}
