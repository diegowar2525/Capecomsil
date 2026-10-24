import { useState } from 'react';
import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { DataTable } from '../../components/DataTable/DataTable.jsx';
import { crudActions } from '../../components/CatalogoPage/catalogo.actions.js';
import { VehiculoModal } from './components/VehiculoModal.jsx';
import { useVehiculos } from './hooks/useVehiculos.js';
import { columns } from './vehiculos.columns.js';
import { page } from './vehiculos.config.js';

import { relatedAction } from './vehiculos.actions.js';

export function VehiculosPage() {
    const { data, loading, error, recargar, guardar, eliminar, kilometraje } = useVehiculos();
    const [search, setSearch] = useState('');
    const [dialog, setDialog] = useState(null);
    const [message, setMessage] = useState('');
    const open = (action, id) => { setMessage(''); setDialog({ action, id }); };
    const saved = (action) => {
        setDialog(null);
        setMessage(action === 'delete' ? 'Vehículo eliminado correctamente.' : 'Vehículo guardado correctamente.');
    };
    const visible = data.filter((row) => columns.some(({ key }) =>
        String(row[key] ?? '').toLowerCase().includes(search.toLowerCase().trim())));
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
        <div className="toolbar-filters">
            <input type="search" className="search-input" aria-label="Buscar vehículos" placeholder="Buscar vehículo…"
                value={search} onChange={(event) => setSearch(event.target.value)} />
            <button type="button" className="btn btn-outline" disabled={loading || Boolean(dialog)} onClick={recargar}>Actualizar listado</button>
        </div>
        <DataTable columns={tableColumns} data={visible} rowKey="id_vehiculo" loading={loading} error={error}
            emptyMessage={search ? 'No hay vehículos que coincidan con la búsqueda.' : 'No hay vehículos registrados.'} />
        {dialog && <VehiculoModal key={`${dialog.action.id}-${dialog.id ?? 'nuevo'}`} {...dialog}
            guardar={guardar} eliminar={eliminar} consultarKilometraje={kilometraje}
            onClose={() => setDialog(null)} onSaved={saved} />}
    </section>;
}
