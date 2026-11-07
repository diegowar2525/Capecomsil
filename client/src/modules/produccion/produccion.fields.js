export const fields = [
    { name: 'fecha_desde', label: 'Desde', type: 'date', required: true },
    { name: 'fecha_hasta', label: 'Hasta', type: 'date', required: true },
    { name: 'id_vehiculo', label: 'Vehículo', type: 'select', source: 'id_vehiculo' },
    { name: 'id_terminal', label: 'Terminal', type: 'select', source: 'id_terminal' }
];
