import { useState } from 'react';
import { PageHeader } from '../PageHeader/PageHeader.jsx';
import { DataTable } from '../DataTable/DataTable.jsx';
import { crudActions } from '../CatalogoPage/catalogo.actions.js';
import { CatalogoModal } from './CatalogoModal.jsx';
import { CatalogoFiltros } from './CatalogoFiltros.jsx';
import { CatalogoPaginacion } from './CatalogoPaginacion.jsx';
import { useCatalogoFiltros } from '../../hooks/useCatalogoFiltros.js';
import { RowActions } from '../RowActions/RowActions.jsx';


export function CatalogoConectado({ definition, controller }) {
    const { page, columns = [], rowKey, filters = [], actions = crudActions, mode = 'list', Card } = definition;
    const { data = [], registro, loading, error, recargar, guardar, eliminar, ejecutar } = controller;
    const single = mode === 'single';
    const canEdit = registro && (!definition.canEdit || definition.canEdit(registro));
    const filterState = useCatalogoFiltros(data, columns, rowKey, filters);
    const [dialog, setDialog] = useState(null);
    const [message, setMessage] = useState('');
    const open = (action, id) => { setMessage(''); setDialog({ action, id }); };
    const saved = (action) => {
        setDialog(null);
        setMessage(action === 'delete' ? 'Registro eliminado correctamente.' : 'Cambios guardados correctamente.');
        if (!single) recargar();
    };


    const tableColumns = [
        ...columns,
        {
            key: 'actions',
            label: 'Acciones',
            render: (row) => (
                <RowActions
                    actions={actions}
                    onAction={(action) => open(action, row[rowKey])}
                />
            )
        }
    ];


    return <section>
        <PageHeader {...page} actionLabel={!loading && !error && (!single || canEdit) ? page.actionLabel : undefined}
            onAction={() => open({ id: single ? 'edit' : 'create', label: page.actionLabel }, single ? registro[rowKey] : undefined)} />
        {message && <p role="status">{message}</p>}
        {single ? <>
            {loading && <p role="status">Cargando…</p>}
            {error && <div><p role="alert">{error}</p><button type="button" className="btn btn-outline" onClick={recargar}>Volver a consultar</button></div>}
            {registro && Card && <Card registro={registro} />}
        </> : <>
            <CatalogoFiltros title={page.title} data={data} filters={filters} state={filterState}
                loading={loading} error={error} refreshDisabled={Boolean(dialog)} onRefresh={recargar} />
            <DataTable columns={tableColumns} data={filterState.pagination.rows} rowKey={rowKey} loading={loading} error={error}
                emptyMessage={filterState.active ? 'No hay coincidencias con los filtros.' : 'No hay registros disponibles.'} />
            {!loading && !error && <CatalogoPaginacion state={filterState} disabled={Boolean(dialog)} />}
        </>}
        {dialog && (!single || canEdit) && <CatalogoModal key={`${dialog.action.id}-${dialog.id ?? 'nuevo'}`} {...dialog} definition={definition}
            guardar={guardar} eliminar={eliminar} ejecutar={ejecutar} onClose={() => setDialog(null)} onSaved={saved} />}
    </section>;
}
