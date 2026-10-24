import { useState } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { DataTable } from '../../components/DataTable/DataTable.jsx';
import { crudActions } from '../../components/CatalogoPage/catalogo.actions.js';
import { VehiculoModal } from './components/VehiculoModal.jsx';
import { useVehiculos } from './hooks/useVehiculos.js';
import { columns } from './vehiculos.columns.js';
import { page } from './vehiculos.config.js';

import { relatedAction } from './vehiculos.actions.js';
import { filters } from './vehiculos.filters.js';
import { CatalogoFiltros } from '../../components/CatalogoConectado/CatalogoFiltros.jsx';
import { useCatalogoFiltros } from '../../hooks/useCatalogoFiltros.js';

export function VehiculosPage() {
    const { data, loading, error, recargar, guardar, eliminar, kilometraje } = useVehiculos();
    const filterState = useCatalogoFiltros(data, columns, 'id_vehiculo', filters);
    const [dialog, setDialog] = useState(null);
    const [message, setMessage] = useState('');
    const open = (action, id) => { setMessage(''); setDialog({ action, id }); };
    const saved = (action) => {
        setDialog(null);
        setMessage(action === 'delete' ? 'Vehículo eliminado correctamente.' : 'Vehículo guardado correctamente.');
    };
    const tableColumns = [...columns, {
        key: 'actions', label: 'Acciones', render: (row) => <div className="record-actions">
            {[...crudActions, relatedAction].map((action) => <button key={action.id} type="button" className="btn btn-outline"
                onClick={() => open(action, row.id_vehiculo)}>{action.label}</button>)}
        </div>
    }];
    return <section>
        <PageHeader {...page} actionLabel={!loading && !error ? page.actionLabel : undefined}
            onAction={() => open({ id: 'create', label: page.actionLabel })} />
        {message && <p role="status">{message}</p>}
        <CatalogoFiltros title={page.title} data={data} filters={filters} state={filterState}
            loading={loading} error={error} refreshDisabled={Boolean(dialog)} onRefresh={recargar} />
        <DataTable columns={tableColumns} data={filterState.visible} rowKey="id_vehiculo" loading={loading} error={error}
            emptyMessage={filterState.active ? 'No hay vehículos que coincidan con los filtros.' : 'No hay vehículos registrados.'} />
        {dialog && <VehiculoModal key={`${dialog.action.id}-${dialog.id ?? 'nuevo'}`} {...dialog}
            guardar={guardar} eliminar={eliminar} consultarKilometraje={kilometraje}
            onClose={() => setDialog(null)} onSaved={saved} />}
    </section>;
}
