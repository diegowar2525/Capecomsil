import { crudActions } from '../../components/CatalogoPage/catalogo.actions.js';
import { fields } from '../modalidades-tarifa/modalidades-tarifa.fields.js';
import { columns } from '../modalidades-tarifa/modalidades-tarifa.columns.js';

export const actions = [
    ...crudActions,
    {
        id: 'modalities',
        parent: 'detail',
        label: 'Historial de modalidades',
        readOnly: true,
        tables: [{ name: 'modalidades', label: 'Vigencias', columns, rowKey: 'id_modalidad_tarifa' }]
    },
    {
        id: 'change-modality',
        parent: 'edit',
        label: 'Cambiar modalidad',
        fields: fields.filter((field) => field.name !== 'id_gasolinera'),
        message: 'Puedes corregir la modalidad del período de la fecha indicada, incluso volver a la anterior el mismo día, si no tiene entregas, recorridos ni liquidaciones asociados. Las tarifas configuradas y las operaciones de otros períodos no bloquean la corrección. Se conservan las fechas y los demás períodos sin añadir historial.'
    }
];
