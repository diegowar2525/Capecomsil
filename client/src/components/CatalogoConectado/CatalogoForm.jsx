import { FormField } from '../FormField/FormField.jsx';

export function CatalogoForm({ fields, values, change, saving, catalogos }) {
    return <div className="form-grid">{fields.map(({ when, source, defaultChecked, defaultValue, ...field }) => {
        if (when && values[when.field] !== when.value) return null;
        return <FormField key={field.name} {...field} disabled={saving} onChange={change}
            options={source ? (catalogos[source] ?? []) : field.options}
            {...(field.type === 'checkbox' ? { checked: values[field.name] ?? defaultChecked ?? false }
                : { value: values[field.name] ?? defaultValue ?? '' })} />;
    })}</div>;
}
