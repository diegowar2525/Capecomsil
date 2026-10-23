import { CatalogoPage } from '../../components/CatalogoPage/CatalogoPage.jsx';
import { columns } from './costos-viaje.columns.js';

const actions = [{ id: 'costs', label: 'Consultar costos de un viaje', global: true, readOnly: true,
    fields: [{ name: 'id_viaje', label: 'Viaje', type: 'select', source: 'id_viaje', required: true }],
    columns: [], tables: [{ name: 'costos', label: 'Costos calculados', columns, rowKey: 'id_costo' }] }];

export function CostosViajePage(props) {
    return <CatalogoPage title="Costos de viaje" subtitle="Costos calculados por el servidor y consultados desde el detalle del viaje."
        columns={columns} rowKey="id_costo" actions={actions} {...props} />;
}
