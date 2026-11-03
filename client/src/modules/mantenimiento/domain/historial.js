export function resumirTrabajo(trabajo) {
    if (!trabajo) return '—';
    const materiales = (trabajo.detalles ?? []).map(item => `${item.nombre_producto ?? item.descripcion_producto}: ${item.cantidad}`).join(', ') || 'Sin materiales';
    return [trabajo.tipo, trabajo.clase, trabajo.placa,
    `Proveedor: ${trabajo.nombre_proveedor ?? 'Sin proveedor'}`,
    `Inicio: ${trabajo.fecha_inicio}`, `Fin: ${trabajo.fecha_fin ?? 'En curso'}`,
    `Total: $${trabajo.monto}`, `Pagado: $${trabajo.total_pagado}`, materiales,
    trabajo.descripcion, trabajo.observacion,
    (trabajo.cumplimientos ?? []).map(item => item.nombre_plan).join(', ')
    ].filter(Boolean).join(' · ');
}
