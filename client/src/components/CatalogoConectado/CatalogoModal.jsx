import { useEffect, useId, useState } from 'react';
import { Modal } from '../Modal/Modal.jsx';
import { DataTable } from '../DataTable/DataTable.jsx';
import { useRegistroCatalogo } from '../../hooks/useRegistroCatalogo.js';
import { useForm } from '../../hooks/useForm.js';
import { valoresIniciales, prepararCampos } from '../../domain/catalogo.js';
import { CatalogoForm } from './CatalogoForm.jsx';
import { CatalogoDetalle } from './CatalogoDetalle.jsx';

export function CatalogoModal(props) {
    const { definition, id, action, onClose, embedded } = props;
    const state = useRegistroCatalogo(definition.api, id, action.id);
    if (state.loading || state.error) {
        const content = <>
            {state.loading ? <p role="status">Cargando…</p> : <>
                <p role="alert">{state.error}</p>
                <button type="button" className="btn btn-outline" onClick={state.reintentar}>Reintentar</button>
            </>}
        </>;
        return embedded ? content : <Modal isOpen title={action.label} onClose={onClose}>{content}</Modal>;
    }
    return <AccionCatalogo {...props} {...state} />;
}

function AccionCatalogo({ definition, id, action, registro, catalogos, extra, guardar, eliminar, ejecutar, onClose, onSaved, embedded = false, onBusy }) {
    const formId = useId();
    const [resultado, setResultado] = useState(null);
    const [childBusy, setChildBusy] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const editable = action.id === 'create' || action.id === 'edit';
    const source = definition.initial ? definition.initial(registro ?? {}) : registro ?? {};
    const fields = editable ? definition.fields : action.fields ?? [];
    const form = useForm({
        initialValues: valoresIniciales(fields, source),
        prepare: (values) => editable ? definition.prepare(values, catalogos) : prepararCampos(fields, values),
        onSubmit: (values) => {
            if (action.query) setResultado(null);
            return action.id === 'delete' ? eliminar(id) : editable ? guardar(id, values) : ejecutar(action.id, id, values);
        },
        onSuccess: (data) => action.query ? setResultado(data) : onSaved(action.id)
    });
    useEffect(() => { onBusy?.(form.saving); }, [form.saving, onBusy]);
    const busy = form.saving || childBusy;
    const displayFields = editable && definition.formFields ? definition.formFields(form.values, catalogos) : fields;
    const close = () => { if (!childBusy) form.closeWhenIdle(onClose); };
    const footer = <>
        {!embedded && <button type="button" className="btn btn-outline" disabled={busy} onClick={close}>Cerrar</button>}
        {(!action.readOnly || action.query) && <button type="submit" form={formId} className="btn btn-primary" disabled={busy}>
            {form.saving ? 'Procesando…' : action.query ? 'Consultar' : action.id === 'delete' ? 'Eliminar registro' : 'Guardar cambios'}
        </button>}
    </>;
    const content = <>
        {form.error && <p role="alert">{form.error}</p>}
        {action.message && <p>{action.message}</p>}
        {editable && definition.formMessage && <p>{definition.formMessage}</p>}
        {action.readOnly && !action.query ? <>
            {action.id === 'detail' && <CatalogoDetalle columns={definition.columns} fields={definition.fields} registro={source} />}
            {action.tables?.map((table) => <section key={table.name}>
                <h3>{table.label}</h3>
                <DataTable columns={table.columns} data={extra?.[table.name] ?? []} rowKey={table.rowKey} />
            </section>)}
        </> : <form id={formId} onSubmit={form.submit} aria-busy={form.saving}>
            {action.id === 'delete'
                ? <p>¿Eliminar <strong>{registro?.nombre ?? registro?.placa ?? id}</strong>? Esta operación no se puede deshacer.</p>
                : <CatalogoForm fields={displayFields} values={form.values} change={form.change} saving={busy} catalogos={catalogos} />}
            {action.query && resultado && <CatalogoDetalle columns={action.columns} fields={[]} registro={resultado} />}
        </form>}
        {!embedded && definition.actions?.filter((item) => item.parent === action.id).map((item) => <section key={item.id} className="catalogo-related-action">
            <button type="button" className="btn btn-outline" disabled={busy}
                aria-expanded={expanded === item.id} aria-controls={`${formId}-${item.id}`}
                onClick={() => setExpanded(expanded === item.id ? null : item.id)}>{item.label}</button>
            <div id={`${formId}-${item.id}`}>
                {expanded === item.id && <CatalogoModal embedded definition={definition} id={id} action={item}
                    guardar={guardar} eliminar={eliminar} ejecutar={ejecutar} onSaved={onSaved} onBusy={setChildBusy} />}
            </div>
        </section>)}
    </>;
    return embedded ? <>{content}<div className="record-actions">{footer}</div></>
        : <Modal isOpen title={action.label} onClose={close} footer={footer}>{content}</Modal>;
}
