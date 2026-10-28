import { useState } from 'react';
import { PageHeader } from '../PageHeader/PageHeader.jsx';
import { Listado } from '../Listado/Listado.jsx';
import { crudActions } from '../CatalogoConectado/catalogo.actions.js';
import { CatalogoModal } from './CatalogoModal.jsx';
import { CatalogoFiltros } from './CatalogoFiltros.jsx';
import { CatalogoPaginacion } from './CatalogoPaginacion.jsx';
import { useCatalogoFiltros } from '../../hooks/useCatalogoFiltros.js';
import { RowActions } from '../RowActions/RowActions.jsx';
import { accionDisponible, organizarAcciones, accionesDeFila } from '../../domain/acciones.js';
import { useAuth } from '../../modules/auth/hooks/useAuth.js';


export function CatalogoConectado({ definition, controller }) {
    const { page, columns = [], rowKey, filters = [], actions: declaredActions = crudActions, mode = 'list', Card } = definition;
    const { data = [], registro, loading, error, recargar, guardar, eliminar, ejecutar } = controller;
    const single = mode === 'single';
    const actions = organizarAcciones(declaredActions, definition.permissionResource, single);
    const modalDefinition = { ...definition, actions };
    const { permisos } = useAuth();
    const permissionFor = (action) => action.permission ?? (single ? undefined :
        `${definition.permissionResource ?? 'catalogos'}.${({ detail: 'consultar', edit: 'editar', delete: 'eliminar', create: 'crear' })[action.id] ?? 'consultar'}`);
    const allowed = (action, row) => accionDisponible({ ...action, permission: permissionFor(action) }, row, permisos);
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
        ...(actions.some(action => !action.global && !action.parent) ? [{
            key: 'actions',
            label: 'Acciones',
            render: (row) => (
                <RowActions
                    actions={accionesDeFila(actions, row, permisos)}
                    onAction={(action) => open(action, row[rowKey])}
                />
            )
        }] : [])
    ];


    return <section>
        <PageHeader {...page} actionLabel={!loading && !error && (!single || canEdit) && allowed({ id: single ? 'edit' : 'create', permission: definition.createPermission }, registro) ? page.actionLabel : undefined}
            onAction={() => open({ id: single ? 'edit' : 'create', label: page.actionLabel }, single ? registro[rowKey] : undefined)} />
        {controller.toolbar}
        <div className="record-actions">{actions.filter(action => action.global && allowed(action)).map(action => <button key={action.id} type="button" className="btn btn-outline" onClick={() => open(action)}>{action.label}</button>)}</div>
        {message && <p role="status">{message}</p>}
        {single ? <>
            {loading && <p role="status">Cargando…</p>}
            {error && <div><p role="alert">{error}</p><button type="button" className="btn btn-outline" onClick={recargar}>Volver a consultar</button></div>}
            {registro && Card && <Card registro={registro} />}
        </> : <>
            <Listado columns={tableColumns} data={filterState.pagination.rows} rowKey={rowKey} loading={loading} error={error}
                emptyMessage={filterState.active ? 'No hay coincidencias con los filtros.' : 'No hay registros disponibles.'}
                toolbar={<CatalogoFiltros title={page.title} data={data} filters={filters} state={filterState}
                    loading={loading} error={error} refreshDisabled={Boolean(dialog)} onRefresh={recargar} />}
                pagination={<CatalogoPaginacion state={filterState} disabled={Boolean(dialog)} />} />
        </>}
        {dialog && (!single || canEdit) && <CatalogoModal key={`${dialog.action.id}-${dialog.id ?? 'nuevo'}`} {...dialog} definition={modalDefinition}
            guardar={guardar} eliminar={eliminar} ejecutar={ejecutar} onClose={() => setDialog(null)} onSaved={saved} />}
    </section>;
}
