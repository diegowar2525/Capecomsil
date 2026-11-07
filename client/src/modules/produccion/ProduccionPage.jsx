import '../../styles/modules/produccion.css';
import { ConsultaCatalogo } from '../../components/CatalogoConectado/ConsultaCatalogo.jsx';
import { fields } from './produccion.fields.js';
import { columns } from './produccion.columns.js';
import { api } from './services/produccion.api.js';
import { totales } from './domain/produccion.js';
import { ProduccionResumen, ProduccionDesgloses } from './components/ProduccionResumen.jsx';
const definition = {
    page: {
        title: 'Producción por vehículos y terminales',
        subtitle: 'Ingresos, galones y margen estimado por vehículo. Períodos de hasta 366 días.'
    },
    rowKey: 'id_vehiculo',
    fields: [],
    columns,
    actions: [],
    filters: [],
    showClearFilters: false,
    permissionResource: 'informes',
    api,
    paginationAfterFooter: true,
    totals: totales,
    Summary: ProduccionResumen,
    Footer: ProduccionDesgloses
};
export function ProduccionPage() {
    return <ConsultaCatalogo definition={definition} fields={fields} />;
}
