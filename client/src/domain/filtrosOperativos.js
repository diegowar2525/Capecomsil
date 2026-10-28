export const seleccion = (name, label, labelKey) => ({ name, label, type: 'select', ...(labelKey ? { labelKey } : {}) });
export const rangoFechas = (field) => [
 { name: 'fecha_desde', label: 'Desde', type: 'date', field, operator: 'from' },
 { name: 'fecha_hasta', label: 'Hasta', type: 'date', field, operator: 'to' }
];
export const rangoImporte = (field, label = 'Importe') => [
 { name: `${field}_min`, label: `${label} mínimo`, type: 'number', field, operator: 'min' },
 { name: `${field}_max`, label: `${label} máximo`, type: 'number', field, operator: 'max' }
];
export const estadoOperacion = (femenino = false) => ({ name: 'estado', label: 'Estado', type: 'select', options:
 femenino ? [{value:'REGISTRADA',label:'Registrada'},{value:'ANULADA',label:'Anulada'}] : [{value:'REGISTRADO',label:'Registrado'},{value:'ANULADO',label:'Anulado'}] });
