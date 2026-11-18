import { useId, useState } from 'react';
import { Save, Power, PowerOff, Trash2, Search, Settings2 } from 'lucide-react';

export function Selector({label, rows, value, onSelect, onCreate, onUpdate, onDelete, disabled, required, permisos, parentReady = true, parentLabel = 'una marca'}) {
    const id = useId();
    const [search,setSearch] = useState('');
    const [searching,setSearching] = useState(false);
    const [editing,setEditing] = useState(false);
    const [nombre,setNombre] = useState('');
    const [confirmDelete,setConfirmDelete] = useState(false);
    const current = rows.find(row=>String(row.value)===String(value));
    const normal = text => text.trim().replace(/\s+/g,' ').toLocaleLowerCase();
    const matches = rows.filter(row=>(row.registro.estado || String(row.value)===String(value)) && (normal(row.label).includes(normal(search)) || String(row.value)===String(value)));
    const duplicate = rows.find(row=>normal(row.label)===normal(search));
    return <fieldset className="marca-modelo__selector" disabled={disabled || !parentReady}>
        <legend>{label}{required ? '' : ' (opcional)'}</legend>
        <div className="marca-modelo__selection">
        <select id={`${id}-select`} className="form-select" aria-label={label} value={value ?? ''} required={required} onChange={event=>{onSelect(event.target.value);setEditing(false);setConfirmDelete(false);setSearch('');setSearching(false);}}>
            <option value="">Seleccionar…</option>
            {matches.map(row=><option key={row.value} value={row.value}>{row.label}{row.registro.estado?'':' (inactivo)'}</option>)}
        </select>
        <button type="button" className="record-action-btn" title={`Buscar o crear ${label.toLowerCase()}`} aria-label={`Buscar o crear ${label.toLowerCase()}`} aria-expanded={searching} onClick={()=>{setSearching(!searching);setSearch('');}}><Search size={18} aria-hidden="true" /></button>
        {current && permisos.includes('catalogos.editar') && <button type="button" className="record-action-btn" title={`Administrar ${label.toLowerCase()}`} aria-label={`Administrar ${label.toLowerCase()}`} aria-expanded={editing} onClick={()=>{setNombre(current.label);setEditing(!editing);setConfirmDelete(false);}}><Settings2 size={18} aria-hidden="true" /></button>}
        </div>
        {searching && <input id={id} aria-label={`Buscar ${label.toLowerCase()}`} className="form-control" value={search} maxLength={100} placeholder="Buscar o escribir un nuevo nombre…"
            onKeyDown={event=>{if(event.key==='Enter') event.preventDefault();}} onChange={event=>setSearch(event.target.value)} />}
        {!parentReady && <small>Selecciona primero {parentLabel}.</small>}
        {search.trim() && !duplicate && permisos.includes('catalogos.crear') && <button type="button" className="btn btn-outline" onClick={async()=>{if(await onCreate(search.trim())){setSearch('');setSearching(false);}}}>Crear {label.toLowerCase()} «{search.trim()}»</button>}
        {duplicate && !duplicate.registro.estado && <small>Ese nombre ya existe y está inactivo. Selecciónalo para reactivarlo.</small>}
        {duplicate && !duplicate.registro.estado && <button type="button" className="btn btn-outline" onClick={()=>{onSelect(duplicate.value);setSearch('');}}>Seleccionar registro inactivo</button>}
        {editing && current && <div className="marca-modelo__admin">
            <label htmlFor={`${id}-nombre`}>Nombre de {label.toLowerCase()}</label>
            <input id={`${id}-nombre`} className="form-control" value={nombre} maxLength={100} onChange={event=>setNombre(event.target.value)} onKeyDown={event=>{if(event.key==='Enter')event.preventDefault();}} />
            <div className="record-actions">
                <button type="button" className="record-action-btn" title="Guardar nombre" aria-label="Guardar nombre" disabled={!nombre.trim()} onClick={()=>onUpdate(current,{nombre:nombre.trim()})}><Save size={20} aria-hidden="true" /></button>
                <button type="button" className="record-action-btn" title={current.registro.estado?'Desactivar':'Reactivar'} aria-label={current.registro.estado?'Desactivar':'Reactivar'} onClick={()=>onUpdate(current,{estado:!current.registro.estado})}>{current.registro.estado ? <PowerOff size={20} aria-hidden="true" /> : <Power size={20} aria-hidden="true" />}</button>
                {permisos.includes('catalogos.eliminar') && <button type="button" className="record-action-btn record-action-delete" title="Eliminar" aria-label="Eliminar" onClick={()=>setConfirmDelete(true)}><Trash2 size={20} aria-hidden="true" /></button>}
            </div>

            {confirmDelete && <div><p>¿Eliminar «{current.label}»?</p><button type="button" className="btn btn-outline" onClick={async()=>{if(await onDelete(current))setEditing(false);}}>Confirmar eliminación</button><button type="button" className="btn btn-outline" onClick={()=>setConfirmDelete(false)}>Cancelar</button></div>}
        </div>}
    </fieldset>;
}

