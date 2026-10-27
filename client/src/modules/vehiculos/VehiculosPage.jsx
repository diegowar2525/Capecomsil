import { CatalogoConectado } from '../../components/CatalogoConectado/CatalogoConectado.jsx';
import { crudActions } from '../../components/CatalogoConectado/catalogo.actions.js';
import { useVehiculos } from './hooks/useVehiculos.js';
import { columns } from './vehiculos.columns.js';
import { fields } from './vehiculos.fields.js';
import { page } from './vehiculos.config.js';
import { relatedAction } from './vehiculos.actions.js';
import { filters } from './vehiculos.filters.js';
import { api } from './services/vehiculos.api.js';
import { prepararVehiculo } from './domain/vehiculo.js';

const definition = {
    page, columns, fields, filters, api, rowKey: 'id_vehiculo', prepare: prepararVehiculo,
    actions: [...crudActions, {
        ...relatedAction, parent: 'detail', query: true,
        message: 'Deja la fecha vacía para consultar el kilometraje hasta el momento actual.'
    }],
    formMessage: 'Indica juntos el kilometraje base y la fecha de inicio del control, o deja ambos vacíos.'
};

export function VehiculosPage() {
    const controller = useVehiculos();
    return <CatalogoConectado definition={definition} controller={controller} />;
}
