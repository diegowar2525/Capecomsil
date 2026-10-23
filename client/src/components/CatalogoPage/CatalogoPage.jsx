import { useState } from 'react';
import { PageHeader } from '../PageHeader/PageHeader.jsx';
import { DataTable } from '../DataTable/DataTable.jsx';
import { Modal } from '../Modal/Modal.jsx';
import { TemplateForm } from './TemplateForm.jsx';

import { crudActions } from './catalogo.actions.js';

export function CatalogoPage({ title, subtitle, actionLabel, columns = [], fields = [], rowKey = 'id',
    data = [], actions = crudActions, filters = [], catalogos = {}, children, renderForm }) {
    const [dialog, setDialog] = useState(null);
    const [search, setSearch] = useState('');
    const open = (action, row = null) => setDialog({ action, row });
    const visible = data.filter((row) => columns.some(({ key }) => String(row[key] ?? '').toLowerCase().includes(search.toLowerCase())));
    const available = (action, row) => (!action.states || action.states.includes(row.estado))
        && (!action.requiresFinished || Boolean(row.fecha_fin)) && (!action.requiresOpen || !row.fecha_fin);
    const tableColumns = actions.length ? [...columns, { key: 'actions', label: 'Acciones', render: (row) =>
        <div className="record-actions">{actions.filter((action) => !action.global && available(action, row)).map((action) =>
            <button key={action.id} type="button" className="btn btn-outline" onClick={() => open(action, row)}>{action.label}</button>)}</div>
    }] : columns;
    return <section>
        <PageHeader title={title} subtitle={subtitle} actionLabel={actionLabel}
            onAction={actionLabel ? () => open({ id: 'create', label: actionLabel, useFields: true }) : undefined} />
        <p className="template-notice">Plantilla: consulta y guardado en el servidor pendientes de conexión.</p>
        <div className="toolbar-filters">
            <input aria-label={`Buscar en ${title}`} type="search" className="search-input" placeholder="Buscar registro…"
                value={search} onChange={(event) => setSearch(event.target.value)} />
            {actions.filter((action) => action.global).map((action) => <button key={action.id} type="button"
                className="btn btn-outline" onClick={() => open(action)}>{action.label}</button>)}
        </div>
        {filters.length > 0 && <details className="template-preview"><summary>Filtros de consulta</summary>
            <TemplateForm fields={filters} catalogos={catalogos} />
            <button type="button" className="btn btn-outline" disabled>Consultar (conexión pendiente)</button>
        </details>}
        {columns.length > 0 && <DataTable columns={tableColumns} data={visible} rowKey={rowKey} />}
        {data.length === 0 && actions.some((action) => !action.global) && <details className="template-preview">
            <summary>Vista previa de los modales</summary>
            <p>Sin registros seleccionados. Estos botones permiten revisar las plantillas.</p>
            <div className="record-actions">{actions.filter((action) => !action.global).map((action) =>
                <button key={action.id} type="button" className="btn btn-outline" onClick={() => open(action)}>{action.label}</button>)}</div>
        </details>}
        {children}
        <Modal isOpen={Boolean(dialog)} title={dialog?.action.label} onClose={() => setDialog(null)} footer={<>
            <button type="button" className="btn btn-outline" onClick={() => setDialog(null)}>Cerrar</button>
            {dialog?.action.readOnly && dialog.action.fields?.length > 0 && <button type="button" className="btn btn-primary" disabled>Consultar</button>}
            {!dialog?.action.readOnly && <button type="button" className="btn btn-primary" disabled title="Conexión con la API pendiente">{dialog?.action.useFields ? 'Guardar' : 'Confirmar'}</button>}
        </>}>
            {dialog && <div key={dialog.action.id}>
                <p className="template-notice">Vista previa; no se realizarán cambios.</p>
                {dialog.action.message && <p>{dialog.action.message}</p>}
                {dialog.action.useFields && renderForm ? renderForm(dialog.row, dialog.action) :
                    <TemplateForm fields={dialog.action.useFields ? fields : dialog.action.fields ?? []}
                        initialValues={dialog.row ?? {}} catalogos={catalogos} />}
                {dialog.action.readOnly && <RecordDetail columns={dialog.action.columns ?? [
                    ...columns, ...fields.filter((field) => field.type !== 'rows' && !columns.some((column) => column.key === field.name))
                        .map((field) => ({ key: field.name, label: field.label }))
                ]} row={dialog.row} />}
                {dialog.action.tables?.map((table) => <section key={table.name} className="template-preview">
                    <h3>{table.label}</h3><DataTable columns={table.columns} data={dialog.row?.[table.name] ?? []} rowKey={table.rowKey} />
                </section>)}
            </div>}
        </Modal>
    </section>;
}

function RecordDetail({ columns, row }) {
    return <dl className="record-detail">{columns.map((column) => <div key={column.key}>
        <dt>{column.label}</dt><dd>{typeof row?.[column.key] === 'boolean' ? (row[column.key] ? 'Sí' : 'No') : String(row?.[column.key] ?? '—')}</dd>
    </div>)}</dl>;
}
