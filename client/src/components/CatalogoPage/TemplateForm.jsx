import { useState } from 'react';
import { FormField } from '../FormField/FormField.jsx';

// Campos declarativos compartidos por las plantillas; no envían datos a la API.
export function TemplateForm({ fields = [], initialValues = {}, catalogos = {}, prefix = '' }) {
    const [values, setValues] = useState(() => Object.fromEntries(fields.map((field) => [field.name,
        initialValues[field.name] ?? field.defaultValue ?? (field.multiple ? [] : field.type === 'checkbox' ? field.defaultChecked ?? false : '')])));
    return <div className="form-grid">
        {fields.map(({ when, requiredWhen, source, fields: children, type, name, label, ...props }) => {
            if (when && values[when.field] !== when.value) return null;
            if (type === 'group') return <fieldset key={name} className="template-details"><legend>{label}</legend><TemplateForm fields={children} initialValues={initialValues[name] ?? {}} catalogos={catalogos} prefix={`${prefix}${name}.`} /></fieldset>;
            if (type === 'rows') return <RepeatedFields key={name} name={`${prefix}${name}`} label={label}
                fields={children} catalogos={catalogos} initialRows={initialValues[name]} {...props} />;
            const options = source ? (catalogos[source] ?? []) : props.options;
            const value = values[name] ?? (type === 'checkbox' ? props.defaultChecked ?? false : props.defaultValue ?? '');
            return <FormField key={name} {...props} name={`${prefix}${name}`} label={label} type={type}
                required={requiredWhen ? values[requiredWhen.field] === requiredWhen.value : props.required}
                options={options} defaultValue={undefined} defaultChecked={undefined}
                {...(type === 'checkbox' ? { checked: value } : { value })}
                onChange={(event) => setValues((previous) => ({ ...previous, [name]: type === 'checkbox' ? event.target.checked
                    : props.multiple ? Array.from(event.target.selectedOptions, (option) => option.value) : event.target.value }))} />;
        })}
    </div>;
}

function RepeatedFields({ name, label, fields, catalogos, initialRows, minRows = 1 }) {
    const [rows, setRows] = useState(() => (initialRows?.length ? initialRows : Array.from({ length: minRows }, () => ({})))
        .map((value, key) => ({ key, value })));
    const [nextKey, setNextKey] = useState(rows.length);
    return <fieldset className="template-details">
        <legend>{label}</legend>
        {rows.map((row, index) => <fieldset key={row.key} className="template-detail-row">
            <legend>{label} {index + 1}</legend>
            <TemplateForm fields={fields} initialValues={row.value} catalogos={catalogos} prefix={`${name}[${index}].`} />
            <button type="button" className="btn btn-outline" disabled={rows.length <= minRows}
                onClick={() => setRows((items) => items.filter((item) => item.key !== row.key))}>Quitar fila {index + 1}</button>
        </fieldset>)}
        <button type="button" className="btn btn-outline" onClick={() => {
            setRows((items) => [...items, { key: nextKey, value: {} }]);
            setNextKey((key) => key + 1);
        }}>Agregar fila</button>
    </fieldset>;
}
