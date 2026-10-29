import { FormField } from '../FormField/FormField.jsx';
import { campoVisible, valoresIniciales } from '../../domain/catalogo.js';

export function CatalogoForm({ fields, values, change, saving, catalogos = {} }) {
    const set = (name, value) => change({ target: { name, value } });
    const updateChild = (field, index, event) => {
        const { name, value, type, checked, multiple, selectedOptions } = event.target;
        const next = type === 'checkbox' ? checked : multiple ? Array.from(selectedOptions, option => option.value) : value;
        set(field.name, index === null ? { ...values[field.name], [name]: next }
            : values[field.name].map((row, i) => i === index ? { ...row, [name]: next } : row));
    };
    return <div className="form-grid">{fields.filter(field => campoVisible(field, values)).map(field => {
        if (field.type === 'rows' || field.type === 'group') return <fieldset key={field.name} className="form-section" disabled={saving}>
            <legend>{field.label}</legend>
            {field.type === 'group' ? <CatalogoForm fields={field.fields} values={values[field.name] ?? {}} change={event => updateChild(field, null, event)} saving={saving} catalogos={catalogos} />
                : <>{(values[field.name] ?? []).map((row, index) => <fieldset key={index} className="form-item-card">
                    <legend>{field.label} {index + 1}</legend>
                    <CatalogoForm fields={field.fields} values={row} change={event => updateChild(field, index, event)} saving={saving} catalogos={catalogos} />
                    <button type="button" className="btn btn-outline" disabled={saving || values[field.name].length <= (field.minRows ?? 0)} onClick={() => set(field.name, values[field.name].filter((_, i) => i !== index))}>Quitar</button>
                </fieldset>)}<button type="button" className="btn btn-outline" disabled={saving} onClick={() => set(field.name, [...(values[field.name] ?? []), valoresIniciales(field.fields)])}>Agregar {field.label.toLowerCase()}</button></>}
        </fieldset>;
        const { when: _when, source, defaultChecked, defaultValue, requiredWhen, labelKey: _labelKey, field: _field, operator: _operator, ...props } = field;
        return <div key={field.name} className={field.type === 'checkbox' ? 'form-checkbox-wrapper' : 'form-field-wrapper'}><FormField {...props}
            required={field.required || Boolean(requiredWhen && values[requiredWhen.field] === requiredWhen.value)}
            disabled={saving || field.disabled} onChange={change} options={source ? catalogos[source] ?? [] : field.options}
            {...(field.type === 'checkbox' ? { checked: values[field.name] ?? defaultChecked ?? false } : { value: values[field.name] ?? defaultValue ?? (field.multiple ? [] : '') })} /></div>;
    })}</div>;
}
