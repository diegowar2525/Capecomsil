import { useId, useState } from 'react';
import { ejemploCampo } from '../../domain/ejemplosCampos.js';

export function FormField({ name, label, type = 'text', options = [], searchable = false, ...props }) {
    const id = useId();
    const [search, setSearch] = useState('');
    const normalizar = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const visibles = searchable ? options.filter(option => normalizar(option.label).includes(normalizar(search)) || String(option.value) === String(props.value)) : options;
    return (
        <div className="form-group">
            <label htmlFor={id} className="form-label">{label}</label>
            {type === 'select' ? (<>
                {searchable && <input type="search" className="form-control" aria-label={`Filtrar ${label.toLowerCase()}`} placeholder="Buscar origen o destino…" value={search} disabled={props.disabled} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') event.preventDefault(); }} />}
                <select id={id} name={name} className="form-select" {...(props.value === undefined ? { defaultValue: '' } : {})} {...props}>
                    {!props.multiple && <option value="">Seleccionar…</option>}
                    {visibles.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
                </select>
                {searchable && !visibles.length && <small role="status">No hay trayectos que coincidan.</small>}
            </>
            ) : type === 'textarea' ? (
                <textarea id={id} name={name} className="form-control" placeholder={ejemploCampo(name, type)} {...props} />
            ) : (
                <input id={id} name={name} type={type} className={type === 'checkbox' ? undefined : 'form-control'} placeholder={ejemploCampo(name, type)} {...props} />
            )}
        </div>
    );
}
