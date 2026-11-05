export const dinero = value => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(value ?? 0));
export const fecha = value => value ? value.slice(0, 10).split('-').reverse().join('/') : 'Sin vencimiento';
export const mesActual = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit' }).format(new Date()).slice(0, 7);
export const nombreMes = mes => new Intl.DateTimeFormat('es-EC', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${mes}-01T12:00:00Z`));
export const columnasConceptos = [{ key: 'concepto', label: 'Concepto' }, { key: 'importe', label: 'Importe', numeric: true, format: dinero }];
export const columnasClientes = [
    { key: 'gasolinera', label: 'Gasolinera' }, { key: 'cantidad_facturas', label: 'Facturas', numeric: true },
    { key: 'cobrado', label: 'Abonado a estas facturas', numeric: true, format: dinero },
    { key: 'saldo', label: 'Saldo pendiente', numeric: true, format: dinero },
    { key: 'vencido', label: 'Vencido', numeric: true, format: dinero }
];
export const columnasFacturas = [
    { key: 'numero_factura', label: 'Factura' }, { key: 'fecha_emision', label: 'Emisión', format: fecha },
    { key: 'fecha_vencimiento', label: 'Vencimiento', format: fecha },
    { key: 'valor_neto', label: 'Neto cobrable', numeric: true, format: dinero },
    { key: 'cobrado', label: 'Abonado', numeric: true, format: dinero },
    { key: 'saldo', label: 'Pendiente', numeric: true, format: dinero }
];
export const movimientos = data => [
    { concepto: 'Cobros de clientes', importe: data.cobros },
    { concepto: 'Gastos pagados (incluye mantenimiento sin factura)', importe: data.gastos_pagados },
    { concepto: 'Pagos a proveedores', importe: data.pagos_proveedores },
    { concepto: 'Total desembolsado', importe: data.desembolsos },
    { concepto: 'Cobros menos desembolsos registrados', importe: data.flujo_registrado }
];
export const criterioMensual = 'Ingresos por transporte de viajes no anulados, según su fecha de inicio. Gastos por fecha del desembolso; remuneraciones por día calculado; mantenimientos por fecha de inicio, una sola vez. Los pagos a proveedores se muestran como desembolsos y no se vuelven a descontar del resultado. Los estimados de viáticos, combustible y peajes no se descuentan: sin registro real, $0. El resultado no representa el saldo bancario.';
