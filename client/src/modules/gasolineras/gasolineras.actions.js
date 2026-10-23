import { crudActions } from '../../components/CatalogoPage/catalogo.actions.js';
import { fields } from '../modalidades-tarifa/modalidades-tarifa.fields.js';
import { columns } from '../modalidades-tarifa/modalidades-tarifa.columns.js';

export const actions = [
    ...crudActions,
    {
        id: 'modalities',
        label: 'Historial de modalidades',
        readOnly: true,
        tables: [{ name: 'modalidades', label: 'Vigencias', columns, rowKey: 'id_modalidad_tarifa' }]
    },
    {
        id: 'change-modality',
        label: 'Cambiar modalidad',
        fields: fields.filter((field) => field.name !== 'id_gasolinera'),
        message: 'El cambio se aplica a esta gasolinera desde la fecha indicada. El período anterior se cierra automáticamente; no puede excluir viajes ya registrados.'
    }
];
