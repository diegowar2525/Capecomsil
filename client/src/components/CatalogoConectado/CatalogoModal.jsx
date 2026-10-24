import { useId } from 'react';
import { Modal } from '../Modal/Modal.jsx';
import { DataTable } from '../DataTable/DataTable.jsx';
import { useRegistroCatalogo } from '../../hooks/useRegistroCatalogo.js';
import { useForm } from '../../hooks/useForm.js';
import { valoresIniciales, prepararCampos } from '../../domain/catalogo.js';
import { CatalogoForm } from './CatalogoForm.jsx';
import { CatalogoDetalle } from './CatalogoDetalle.jsx';

export function CatalogoModal(props) {
    const { definition, id, action, onClose } = props;
    const state = useRegistroCatalogo(definition.api, id, action.id);
    if (state.loading || state.error) {
        return <Modal isOpen title={action.label} onClose={onClose}>
            {state.loading ? <p role="status">Cargando…</p> : <>
                <p role="alert">{state.error}</p>
                <button type="button" className="btn btn-outline" onClick={state.reintentar}>Reintentar</button>
            </>}
        </Modal>;
    }
    return <AccionCatalogo {...props} {...state} />;
}

function AccionCatalogo({ definition, id, action, registro, catalogos, extra, guardar, eliminar, ejecutar, onClose, onSaved }) {
    const formId = useId();
    const editable = action.id === 'create' || action.id === 'edit';
    const source = definition.initial ? definition.initial(registro ?? {}) : registro ?? {};
    const fields = editable ? definition.fields : action.fields ?? [];
    const form = useForm({
        initialValues: valoresIniciales(fields, source),
        prepare: (values) => editable ? definition.prepare(values, catalogos) : prepararCampos(fields, values),
        onSubmit: (values) => action.id === 'delete' ? eliminar(id) : editable ? guardar(id, values) : ejecutar(action.id, id, values),
        onSuccess: () => onSaved(action.id)
    });
    const displayFields = editable && definition.formFields ? definition.formFields(form.values, catalogos) : fields;
    const close = () => form.closeWhenIdle(onClose);
    return <Modal isOpen title={action.label} onClose={close} footer={<>
        <button type="button" className="btn btn-outline" disabled={form.saving} onClick={close}>Cerrar</button>
        {!action.readOnly && <button type="submit" form={formId} className="btn btn-primary" disabled={form.saving}>
            {form.saving ? 'Procesando…' : action.id === 'delete' ? 'Eliminar registro' : 'Guardar cambios'}
        </button>}
    </>}>
        {form.error && <p role="alert">{form.error}</p>}
        {action.message && <p>{action.message}</p>}
        {action.readOnly ? <>
            {action.id === 'detail' && <CatalogoDetalle columns={definition.columns} fields={definition.fields} registro={source} />}
            {action.tables?.map((table) => <section key={table.name}>
                <h3>{table.label}</h3>
                <DataTable columns={table.columns} data={extra?.[table.name] ?? []} rowKey={table.rowKey} />
            </section>)}
        </> : <form id={formId} onSubmit={form.submit} aria-busy={form.saving}>
            {action.id === 'delete'
                ? <p>¿Eliminar <strong>{registro?.nombre ?? id}</strong>? Esta operación no se puede deshacer.</p>
                : <CatalogoForm fields={displayFields} values={form.values} change={form.change} saving={form.saving} catalogos={catalogos} />}
        </form>}
    </Modal>;
}
