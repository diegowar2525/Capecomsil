export function resumirRecorrido(tramos = []) {
    if (!tramos.length) return [];
    const ordenados = [...tramos].sort((a, b) => Number(a.orden) - Number(b.orden));
    const paradas = [ordenados[0].nombre_origen ?? 'Origen sin registrar'];
    let kilometros = 0;
    for (const tramo of ordenados) {
        paradas.push(tramo.nombre_destino ?? 'Destino sin registrar');
        kilometros += Number(tramo.kilometros);
    }
    return [{ recorrido: paradas.join(' → '), kilometros: kilometros.toFixed(2) }];
}
