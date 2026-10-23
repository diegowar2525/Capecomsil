import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { FormField } from '../../components/FormField/FormField.jsx';
import { ViajeForm } from './components/ViajeForm.jsx';
import { columns } from './viajes.columns.js';
import { actions } from './viajes.actions.js';

export function Viajes({ viajes = [], catalogos = {} }) {
    return <CatalogoPage title="Gestión de viajes" subtitle="Despachos, entregas y recorrido automático"
        actionLabel="Registrar viaje" columns={columns} rowKey="id_viaje" data={viajes} actions={actions}
        filters={[{ name: 'estado', label: 'Estado', type: 'select', options: [
            { value: 'REGISTRADO', label: 'Registrado' }, { value: 'ANULADO', label: 'Anulado' }
        ] }]}
        renderForm={(row, action) => <>
            <ViajeForm catalogos={catalogos} initialViaje={row} />
            {action.id === 'edit' && <FormField name="motivo" label="Motivo de modificación" type="textarea" required maxLength={150} />}
        </>} />;
}
