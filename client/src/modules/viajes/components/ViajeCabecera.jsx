import { FormField } from '../../../components/FormField/FormField.jsx';

export function ViajeCabecera({ cabecera, origen, lugares, opcionesVehiculos, opcionesChoferes, onCabecera, onOrigen }) {
    return (
            <fieldset className="form-grid">
                <legend>Datos del viaje</legend>
                {['fecha_inicio', 'fecha_fin'].map((name) => <FormField key={name} name={name} label={name === 'fecha_inicio' ? 'Fecha y hora de inicio' : 'Fecha y hora de fin'} type="datetime-local" required value={cabecera[name]} onChange={(event) => onCabecera(name, event.target.value)} />)}
                <FormField name="id_vehiculo" label="Vehículo" type="select" options={opcionesVehiculos} required value={cabecera.id_vehiculo} onChange={(event) => onCabecera('id_vehiculo', event.target.value)} />
                <FormField name="id_chofer" label="Chofer" type="select" options={opcionesChoferes} required value={cabecera.id_chofer} onChange={(event) => onCabecera('id_chofer', event.target.value)} />
                <FormField name="origen" label="Origen inicial / terminal de carga" type="select" options={lugares.filter((item) => item.value.startsWith('terminal:'))} required value={origen} onChange={(event) => onOrigen(event.target.value)} />
            </fieldset>
    );
}
