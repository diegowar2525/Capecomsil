import { totalesConsulta } from './domain/consulta-totales.js';
import { ConsultaCatalogo } from '../../components/CatalogoConectado/ConsultaCatalogo.jsx';
import {
    InformeImpresion,
    TablaInforme
} from '../../components/InformeImpresion/InformeImpresion.jsx';
import { actions } from './informes.actions.js';
import { crearConsultaInforme } from './services/informes.api.js';
import { formatearColumnaInforme } from './domain/consulta-formatos.js';

const specifications = {
    viajes: {
        title: 'Consulta de viajes',
        subtitle:
            'Trabajo realizado y costos estimados. Los ingresos de viajes no equivalen a facturación.',
        rowKey: 'id_viaje'
    },
    viaticos: {
        title: 'Consulta de viáticos',
        subtitle:
            'Estimado diario y desembolsos asociados al día del viático, aunque se pagaran después. Sin desembolso, $0.',
        rowKey: 'id_viatico_chofer'
    },
    'consumo-combustible': {
        title: 'Consumo de combustible',
        subtitle:
            'Comparación entre cargas de tanque lleno. Selecciona un período de hasta 366 días.',
        rowKey: 'id_abastecimiento_fin'
    }
};

function buildDefinition(id) {
    const action = actions.find((item) => item.id === id);
    const spec = specifications[id];
    const columns = action.tables[0].columns.map(formatearColumnaInforme);
    function ImpresionConsulta({ params, options, data, loading, error }) {
        const generatedAt = new Date().toLocaleString('sv-SE', { timeZone: 'America/Guayaquil' });
        const criteria = `Del ${params.fecha_desde} al ${params.fecha_hasta}`;
        const placa =
            options?.id_vehiculo?.find((item) => String(item.value) === String(params.id_vehiculo))
                ?.label ?? data[0]?.placa;
        const chofer =
            options?.id_chofer?.find((item) => String(item.value) === String(params.id_chofer))
                ?.label ?? data[0]?.nombre;
        const alcance = params.id_vehiculo
            ? `Placa ${placa ?? 'no disponible'}`
            : params.id_chofer
              ? `Chofer ${chofer ?? 'no disponible'}`
              : 'General';
        return (
            <InformeImpresion
                title={`${spec.title} - ${alcance}`}
                subtitle={criteria}
                generatedAt={generatedAt}
                disabled={loading || Boolean(error)}
            >
                <p className="resumen-nota">
                    {spec.subtitle} · {data.length} registros.{' '}
                    {params.id_vehiculo
                        ? `Vehículo: ${data[0]?.placa ?? 'Sin resultados para el vehículo seleccionado'}.`
                        : ''}
                    {params.id_chofer
                        ? `Chofer: ${data[0]?.nombre ?? 'Sin resultados para el chofer seleccionado'}.`
                        : ''}
                </p>
                <TablaInforme columns={columns} rows={data} totals={totalesConsulta(id, data)} />
            </InformeImpresion>
        );
    }
    return {
        page: spec,
        rowKey: spec.rowKey,
        fields: [],
        columns,
        actions: [],
        permissionResource: 'informes',
        totals: (data) => totalesConsulta(id, data),
        filters: [],
        showClearFilters: false,
        Summary: ImpresionConsulta,
        api: crearConsultaInforme(id),
        searchFields: action.fields
    };
}
const definitions = Object.fromEntries(
    Object.keys(specifications).map((id) => [id, buildDefinition(id)])
);
export function ConsultaViajesPage() {
    return (
        <ConsultaCatalogo
            definition={definitions.viajes}
            fields={definitions.viajes.searchFields}
        />
    );
}
export function ConsultaViaticosPage() {
    return (
        <ConsultaCatalogo
            definition={definitions.viaticos}
            fields={definitions.viaticos.searchFields}
        />
    );
}
export function ConsultaCombustiblePage() {
    return (
        <ConsultaCatalogo
            definition={definitions['consumo-combustible']}
            fields={definitions['consumo-combustible'].searchFields}
        />
    );
}
