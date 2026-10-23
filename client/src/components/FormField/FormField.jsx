import { useId } from 'react';

export function FormField({ name, label, type = 'text', options = [], ...props }) {
    const id = useId();
    return (
        <div className="form-group">
            <label htmlFor={id} className="form-label">{label}</label>
            {type === 'select' ? (
                <select id={id} name={name} className="form-select" {...(props.value === undefined ? { defaultValue: '' } : {})} {...props}>
                    {!props.multiple && <option value="">Seleccionar…</option>}
                    {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
            ) : type === 'textarea' ? (
                <textarea id={id} name={name} className="form-control" {...props} />
            ) : (
                <input id={id} name={name} type={type} className={type === 'checkbox' ? undefined : 'form-control'} {...props} />
            )}
        </div>
    );
}
