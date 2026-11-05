const money = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });
const decimal = new Intl.NumberFormat('es-EC', { maximumFractionDigits: 6 });
const montos = new Set(['ingreso_transporte', 'costo_estimado_total', 'margen_estimado', 'estimado', 'gasto_real_registrado', 'diferencia']);
const estados = {
    SIN_GASTOS_REGISTRADOS: 'Sin desembolso', REGISTRADO: 'Registrado', COMPARABLE: 'Comparable',
    SIN_CARGA_INICIAL: 'Sin carga inicial', ODOMETRO_SIN_AVANCE: 'Odómetro sin avance',
    VIAJES_CRUZAN_LIMITES: 'Viajes cruzan el intervalo', SIN_REFERENCIA_VIAJES: 'Sin referencia de viajes'
};
export const formatearColumnaInforme = column => {
    const format = value => {
        if (value === null || value === undefined) return '—';
        if (montos.has(column.key)) return money.format(Number(value));
        if (column.key.startsWith('fecha')) {
            const [date, time] = String(value).split('T');
            return `${date.slice(0,10).split('-').reverse().join('/')}${time ? ` ${time.slice(0,5)}` : ''}`;
        }
        if (column.key === 'estado_comparacion') return estados[value] ?? value;
        if (['galones_consumidos', 'consumo_real_galones_km'].includes(column.key)) return decimal.format(Number(value));
        return value;
    };
    return { ...column, numeric: montos.has(column.key), format, render: row => format(row[column.key]) };
};
