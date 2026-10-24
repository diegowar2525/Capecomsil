import { FormField } from '../../../components/FormField/FormField.jsx';
import { relatedAction } from '../vehiculos.actions.js';
import { VehiculoDetalle } from './VehiculoDetalle.jsx';

export function VehiculoKilometraje({ vehiculo, values, change, saving, resultado }) {
    return <>
        <p>Vehículo: {vehiculo.placa}. Deja la fecha vacía para consultar hasta el momento actual.</p>
        <div className="form-grid">
            <FormField {...relatedAction.fields[0]} value={values.fecha_hasta} onChange={change} disabled={saving} />
        </div>
        {resultado && <VehiculoDetalle vehiculo={resultado} campos={relatedAction.columns} />}
    </>;
}
