import { dinero } from '../resumen/domain/resumen.js';
export const columns = [
    { key: 'placa', label: 'Placa' }, { key: 'viajes', label: 'Viajes', numeric: true },
    { key: 'entregas', label: 'Entregas', numeric: true }, { key: 'galones', label: 'Galones', numeric: true },
    ...[['ingresos','Ingresos'],['costo_estimado','Costo estimado'],['margen_estimado','Margen estimado']].map(([key,label]) => ({ key,label,numeric:true,format: value => value == null ? '—' : dinero(value),render: row => row[key] == null ? '—' : dinero(row[key]) })),
    { key: 'participacion', label: '% ingresos', numeric: true, format: value => `${Number(value).toFixed(2)}%`, render: row => `${Number(row.participacion).toFixed(2)}%` }
];
