// Lista explícita: nunca reenviar IDs ni campos calculados recibidos del servidor.
export function prepararVehiculo(values) {
    const text = (name) => String(values[name] ?? '').trim();
    const kilometraje = text('kilometraje_base');
    const fecha = text('fecha_inicio_control_km');
    if (Boolean(kilometraje) !== Boolean(fecha)) {
        throw new Error('Indica juntos el kilometraje base y la fecha de inicio del control, o deja ambos vacíos.');
    }
    return {
        placa: text('placa').toUpperCase(),
        marca: text('marca'),
        modelo: text('modelo'),
        anio: Number(text('anio')),
        capacidad_galones: text('capacidad_galones'),
        kilometraje_base: kilometraje || null,
        fecha_inicio_control_km: fecha || null,
        imagen_url: text('imagen_url') || null,
        estado: values.estado === true
    };
}
