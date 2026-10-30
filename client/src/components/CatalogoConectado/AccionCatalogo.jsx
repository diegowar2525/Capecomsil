import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FotoSelector } from '../FotoSelector/FotoSelector.jsx';
import { guardarConFoto } from '../../services/guardar-con-foto.js';
import { Modal } from '../Modal/Modal.jsx';
import { DataTable } from '../DataTable/DataTable.jsx';
import { CatalogoModal } from './CatalogoModal.jsx';
import { accionDisponible } from '../../domain/acciones.js';
import { useAuth } from '../../modules/auth/hooks/useAuth.js';
import { useForm } from '../../hooks/useForm.js';
import { valoresIniciales, prepararCampos } from '../../domain/catalogo.js';
import { CatalogoForm } from './CatalogoForm.jsx';
import { CatalogoDetalle } from './CatalogoDetalle.jsx';

export function AccionCatalogo({ definition, id, action, registro, catalogos, extra, guardar, eliminar, ejecutar, actualizarRegistro, onClose, onSaved, embedded = false, onBusy }) {
    const { permisos } = useAuth();
    const formId = useId();
    const [resultado, setResultado] = useState(null);
    const [childBusy, setChildBusy] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const [foto, setFoto] = useState({ archivo: null, quitar: false });
    const savedId = useRef(id);
    const editable = action.id === 'create' || action.id === 'edit';
    const source = definition.initial ? definition.initial(registro ?? {}) : registro ?? {};
    const fields = action.fields ?? (editable ? definition.fields : []);
    const form = useForm({
        initialValues: valoresIniciales(fields, source),
        prepare: (values) => editable ? definition.prepare(values, catalogos, registro, action) : definition.prepareAction ? definition.prepareAction(action, values, registro) : prepararCampos(fields, values),
        onSubmit: (values) => {
            if (action.query) setResultado(null);
            if (editable && definition.foto) return guardarConFoto({
                id: savedId.current, data: values, foto, api: definition.foto, rowKey: definition.rowKey,
                guardar, actualizarRegistro, recordarRegistro: value => { savedId.current = value; }
            });
            return action.id === 'delete' ? eliminar(id, registro) : editable ? guardar(id, values) : ejecutar(action.id, id, values);
        },
        onSuccess: (data) => action.query ? setResultado(data) : onSaved(action.id)
    });
    useEffect(() => { onBusy?.(form.saving); }, [form.saving, onBusy]);
    const busy = form.saving || childBusy;
    const displayFields = editable && definition.formFields ? definition.formFields(form.values, catalogos, registro) : fields;
    const close = () => { if (!childBusy) form.closeWhenIdle(onClose); };
    const fotoSelector = editable && definition.foto ? <FotoSelector actual={form.values.imagen_url} value={foto}
        onChange={value => { setFoto(value); form.clearError(); }} disabled={busy} variant={definition.fotoVariant} /> : null;
    const footer = <>
        {!embedded && <button type="button" className="btn btn-outline" disabled={busy} onClick={close}>Cerrar</button>}
        {(!action.readOnly || action.query) && <button type="submit" form={formId} className="btn btn-primary" disabled={busy}>
            {form.saving ? 'Procesando…' : action.query ? 'Consultar' : action.id === 'delete' ? 'Eliminar registro' : action.id === 'annul' ? 'Anular registro' : !editable ? action.label : 'Guardar cambios'}
        </button>}
    </>;
    const content = <>
        {form.error && <p role="alert">{form.error}</p>}
        {action.message && <p>{action.message}</p>}
        {editable && definition.formMessage && <p>{definition.formMessage}</p>}
        {action.readOnly && !action.query ? <>
            {action.id === 'detail' && <CatalogoDetalle columns={definition.columns} fields={definition.fields} registro={source} rowKey={definition.rowKey} catalogos={catalogos} />}
            {action.tables?.map((table) => <section key={table.name} className="catalogo-detalle-tabla">
                <h3>{table.label}</h3>
                <DataTable columns={table.columns} data={extra?.[table.name] ?? registro?.[table.name] ?? []} rowKey={table.rowKey} />
            </section>)}
        </> : editable && definition.Form ? <definition.Form id={formId} registro={registro} catalogos={catalogos} guardar={guardar} onSaved={onSaved} onBusy={setChildBusy} action={action} /> : <form id={formId} onSubmit={form.submit} aria-busy={form.saving}>
            {action.id === 'delete'
                ? <p>¿Eliminar <strong>{registro?.nombre ?? registro?.placa ?? id}</strong>? Esta operación no se puede deshacer.</p>
                : definition.renderForm && editable ? definition.renderForm({ form, registro, catalogos, action, saving: busy, fotoSelector }) : <CatalogoForm fields={editable && definition.foto ? displayFields.filter(field => field.name !== 'imagen_url') : displayFields} values={form.values} change={form.change} saving={busy} catalogos={catalogos} />}
            {!definition.renderForm && fotoSelector}
            {action.query && resultado && <>
                <CatalogoDetalle columns={action.columns ?? []} fields={[]} registro={resultado} />
                {action.tables?.map(table => <section key={table.name}><h3>{table.label}</h3><DataTable columns={table.columns} data={resultado[table.name] ?? []} rowKey={table.rowKey} /></section>)}
            </>}
        </form>}
        {!embedded && definition.actions?.filter((item) => item.parent === action.id && accionDisponible(item, registro, permisos)).map((item) => <section key={item.id} className="catalogo-related-action">
            <button type="button" className="btn btn-outline" disabled={busy}
                aria-expanded={expanded === item.id} aria-controls={`${formId}-${item.id}`}
                onClick={() => setExpanded(expanded === item.id ? null : item.id)}><span>{item.label}</span><ChevronDown size={18} aria-hidden="true" /></button>
            <div id={`${formId}-${item.id}`}>
                {expanded === item.id && <CatalogoModal embedded definition={definition} id={id} action={item}
                    guardar={guardar} eliminar={eliminar} ejecutar={ejecutar} onSaved={onSaved} onBusy={setChildBusy} />}
            </div>
        </section>)}
    </>;
    return embedded ? <>{content}<div className="record-actions">{footer}</div></>
        : <Modal isOpen title={action.label} onClose={close} footer={footer} className={definition.modalClassName}>{content}</Modal>;
}

