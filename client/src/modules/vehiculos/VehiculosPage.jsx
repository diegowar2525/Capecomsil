import { crudActions } from '../../components/CatalogoPage/catalogo.actions.js';
import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { fields } from './vehiculos.fields.js';
import { columns } from './vehiculos.columns.js';
import { page } from './vehiculos.config.js';

import { relatedAction } from './vehiculos.actions.js';

export function VehiculosPage() {
    return <CatalogoPage rowKey="id_vehiculo" {...page} columns={columns} fields={fields} actions={[...crudActions, relatedAction]} />;
}
