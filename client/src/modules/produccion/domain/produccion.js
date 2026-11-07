export function totales(rows) {
    return Object.fromEntries(['viajes','entregas','galones','ingresos','costo_estimado','margen_estimado'].map(key => [key,
        rows.length && rows.every(row => row[key] == null) ? null : rows.reduce((n,row) => n + Math.round(Number(row[key] ?? 0)*100),0)/100
    ]));
}
export function matriz(rows) {
    const terminales = [...new Map(rows.flatMap(row => (row.terminales ?? []).map(t => [t.id_terminal,t.terminal]))).entries()];
    return { terminales, rows: rows.map(row => ({ placa: row.placa, ingresos: row.ingresos,
        ...Object.fromEntries(terminales.map(([id]) => [`terminal_${id}`, row.terminales.find(t => t.id_terminal === id)?.ingresos ?? 0])) })) };
}
