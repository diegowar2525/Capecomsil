import { useId, useState } from 'react';
import { Modal } from '../../../components/Modal/Modal.jsx';
import { useForm } from '../../../hooks/useForm.js';
import { useVehiculo } from '../hooks/useVehiculo.js';
import { prepararVehiculo } from '../domain/vehiculo.js';
import { VehiculoForm } from './VehiculoForm.jsx';
import { VehiculoDetalle } from './VehiculoDetalle.jsx';
import { VehiculoEliminar } from './VehiculoEliminar.jsx';
import { VehiculoKilometraje } from './VehiculoKilometraje.jsx';

export function VehiculoModal(props) {
    const { vehiculo, loading, error } = useVehiculo(props.id);
    if (loading || error) {
        return <Modal isOpen title={props.action.label} onClose={props.onClose}>
            {loading ? <p role="status">Cargando vehículo…</p> : <p role="alert">{error}</p>}
        </Modal>;
    }
    return <VehiculoAccion {...props} vehiculo={vehiculo} />;
}

function VehiculoAccion({ action, id, vehiculo, guardar, eliminar, consultarKilometraje, onClose, onSaved }) {
    const formId = useId();
    const [resultado, setResultado] = useState(null);
    const editable = action.id === 'create' || action.id === 'edit';
    const form = useForm({
        initialValues: editable ? { ...vehiculo, estado: vehiculo?.estado ?? true } : { fecha_hasta: '' },
        prepare: editable ? prepararVehiculo : undefined,
        onSubmit: (data) => {
            if (action.id === 'kilometraje') {
                setResultado(null);
                return consultarKilometraje(id, data.fecha_hasta);
            }
            return action.id === 'delete' ? eliminar(id) : guardar(id, data);
        },
        onSuccess: (data) => {
            if (action.id === 'kilometraje') setResultado(data);
            else onSaved(action.id);
        }
    });
    const close = () => form.closeWhenIdle(onClose);
    return <Modal isOpen title={action.label} onClose={close} footer={<>
        <button type="button" className="btn btn-outline" onClick={close} disabled={form.saving}>Cerrar</button>
        {action.id !== 'detail' && <button type="submit" form={formId} className="btn btn-primary" disabled={form.saving}>
            {form.saving ? 'Procesando…' : action.id === 'delete' ? 'Eliminar vehículo' : action.id === 'kilometraje' ? 'Consultar' : 'Guardar cambios'}
        </button>}
    </>}>
        {form.error && <p role="alert">{form.error}</p>}
        {action.id === 'detail' ? <VehiculoDetalle vehiculo={vehiculo} /> :
            <form id={formId} onSubmit={form.submit} aria-busy={form.saving}>
                {editable && <VehiculoForm values={form.values} change={form.change} saving={form.saving} />}
                {action.id === 'delete' && <VehiculoEliminar vehiculo={vehiculo} />}
                {action.id === 'kilometraje' && <VehiculoKilometraje vehiculo={vehiculo}
                    values={form.values} change={form.change} saving={form.saving} resultado={resultado} />}
            </form>}
    </Modal>;
}
