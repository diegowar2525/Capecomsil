import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './vehiculos.fields.js';
import { columns } from './vehiculos.columns.js';
import { page } from './vehiculos.config.js';

export function VehiculosPage() {
    return <CatalogoPage rowKey="id_vehiculo" {...page} columns={columns} fields={fields} />;
}
