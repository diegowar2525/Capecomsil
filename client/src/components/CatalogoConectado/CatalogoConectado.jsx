import { useState } from 'react';
import { PageHeader } from '../PageHeader/PageHeader.jsx';
import { DataTable } from '../DataTable/DataTable.jsx';
import { crudActions } from '../CatalogoPage/catalogo.actions.js';
import { CatalogoModal } from './CatalogoModal.jsx';
import { CatalogoFiltros } from './CatalogoFiltros.jsx';
import { useCatalogoFiltros } from '../../hooks/useCatalogoFiltros.js';

export function CatalogoConectado({ definition, controller }) {
    const { page, columns, rowKey, filters = [], actions = crudActions } = definition;
    const { data, loading, error, recargar, guardar, eliminar, ejecutar } = controller;
    const filterState = useCatalogoFiltros(data, columns, rowKey, filters);
    const [dialog, setDialog] = useState(null);
    const [message, setMessage] = useState('');
    const open = (action, id) => { setMessage(''); setDialog({ action, id }); };
    const saved = (action) => {
        setDialog(null);
        setMessage(action === 'delete' ? 'Registro eliminado correctamente.' : 'Cambios guardados correctamente.');
        recargar();
    };
    const tableColumns = [...columns, { key: 'actions', label: 'Acciones', render: (row) =>
        <div className="record-actions">{actions.map((action) =>
            <button key={action.id} type="button" className="btn btn-outline" onClick={() => open(action, row[rowKey])}>{action.label}</button>
        )}</div> }];
    return <section>
        <PageHeader {...page} actionLabel={!loading && !error ? page.actionLabel : undefined}
            onAction={() => open({ id: 'create', label: page.actionLabel })} />
        {message && <p role="status">{message}</p>}
        <CatalogoFiltros title={page.title} data={data} filters={filters} state={filterState}
            loading={loading} error={error} refreshDisabled={Boolean(dialog)} onRefresh={recargar} />
        <DataTable columns={tableColumns} data={filterState.visible} rowKey={rowKey} loading={loading} error={error}
            emptyMessage={filterState.active ? 'No hay coincidencias con los filtros.' : 'No hay registros disponibles.'} />
        {dialog && <CatalogoModal key={`${dialog.action.id}-${dialog.id ?? 'nuevo'}`} {...dialog} definition={definition}
            guardar={guardar} eliminar={eliminar} ejecutar={ejecutar} onClose={() => setDialog(null)} onSaved={saved} />}
    </section>;
}
