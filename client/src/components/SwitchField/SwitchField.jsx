import { useId } from 'react';

export function SwitchField({ label, description, ...props }) {
    const id = useId();
    return <label className="switch-field-row" htmlFor={id}>
        <span className="switch-field-info">
            <span className="switch-field-title">{label}</span>
            {description && <span id={`${id}-description`} className="switch-field-description">{description}</span>}
        </span>
        <input {...props} id={id} type="checkbox" className="switch-field-input"
            aria-describedby={description ? `${id}-description` : undefined} />
        <span className="switch-field-track" aria-hidden="true"><span className="switch-field-thumb" /></span>
    </label>;
}
