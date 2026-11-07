const campos = {
    'costos-viaje': ['valor'],
    remuneraciones: ['total', 'costo_asignado', 'costo_sin_asignar'],
    viajes: ['ingreso_transporte', 'costo_estimado_total', 'margen_estimado'],
    viaticos: ['estimado', 'gasto_real_registrado', 'diferencia'],
    'consumo-combustible': ['galones_consumidos']
};
// Los índices de consumo no son aditivos. No se suman gal/km ni identificadores.
export function totalesConsulta(tipo, rows) {
    return Object.fromEntries((campos[tipo] ?? []).map(key => [key,
        rows.reduce((sum, row) => sum + Math.round(Number(row[key] ?? 0) * 1000000), 0) / 1000000
    ]));
}
