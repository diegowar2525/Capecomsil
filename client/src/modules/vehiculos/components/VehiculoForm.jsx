import { FormField } from '../../../components/FormField/FormField.jsx';
import { fields } from '../vehiculos.fields.js';

export function VehiculoForm({ values, change, saving }) {
    return <>
        <div className="form-grid">{fields.map(({ defaultChecked, ...field }) =>
            <FormField key={field.name} {...field} disabled={saving} onChange={change}
                {...(field.type === 'checkbox' ? { checked: values[field.name] ?? defaultChecked ?? false }
                    : { value: values[field.name] ?? '' })} />
        )}</div>
        <p>Indica juntos el kilometraje base y la fecha de inicio del control, o deja ambos vacíos.</p>
    </>;
}
