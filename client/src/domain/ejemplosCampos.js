// Ayudas visuales; no establecen valores ni reglas de validación.
const ejemplos = {
    correo: 'Ej.: nombre@empresa.com',
    telefono: 'Ej.: 0991234567',
    cedula: '10 dígitos, sin espacios ni guiones',
    ruc: '13 dígitos, sin espacios ni guiones',
    numero_factura: 'Ej.: 001-001-000000123',
    numero_comprobante: 'Ej.: TRANS-000123',
    numero_cheque: 'Ej.: 000123',
    banco: 'Nombre de la entidad bancaria',
    representante_legal: 'Ej.: Ana Pérez',
    direccion: 'Ej.: Av. Principal 123 y Calle Segunda',
    ubicacion: 'Ej.: Km 12 de la vía principal',
    placa: 'Ej.: ABC-1234',
    anio: 'Ej.: 2024',
    capacidad_galones: 'Ej.: 8000',
    kilometraje_base: 'Ej.: 125000',
    kilometraje_odometro: 'Ej.: 125500',
    kilometraje_referencia_inicial: 'Ej.: 120000',
    intervalo_km: 'Ej.: 8000',
    anticipacion_aviso_km: 'Ej.: 500',
    kilometros: 'Ej.: 25.50',
    galones: 'Ej.: 4000',
    consumo_galones_km: 'Ej.: 0.100000',
    precio_por_galon: 'Ej.: 2.7500',
    valor_por_galon: 'Ej.: 0.0350',
    precio_unitario: 'Ej.: 25.50',
    cantidad: 'Ej.: 3',
    cantidad_recibida: 'Ej.: 5',
    stock_minimo: 'Ej.: 2',
    monto: 'Ej.: 150.00',
    importe: 'Ej.: 2.00',
    importe_diario: 'Ej.: 12.00',
    adicional_dia_especial: 'Ej.: 10.00',
    descuento: 'Ej.: 0.00',
    porcentaje_impuesto: 'Porcentaje indicado en la factura',
    numero_detalle: 'Ej.: 1',
    unidad_medida: 'Ej.: galón',
    medida: 'Ej.: 11R22.5 o 20 × 10 cm',
    descripcion: 'Describe las características o el concepto',
    observacion: 'Añade algún detalle adicional, si corresponde',
    motivo: 'Describe la razón de la operación'
};

export function ejemploCampo(name, type) {
    if (!['text', 'number', 'email', 'tel', 'textarea', 'url'].includes(type)) return undefined;
    return ejemplos[name];
}
