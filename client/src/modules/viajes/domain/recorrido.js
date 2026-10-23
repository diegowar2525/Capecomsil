export const punto = (tipo, id) => id ? `${tipo}:${id}` : '';

export function construirRecorrido({ origen, paradas, destinoFinal, trayectos = [], seleccion = {} }) {
    const destinos = paradas.map((parada) => punto('gasolinera', parada.id_gasolinera));
    if (destinoFinal) destinos.push(destinoFinal);
    return destinos.map((destino, index) => {
        const desde = index === 0 ? origen : destinos[index - 1];
        const clave = `${desde}>${destino}`;
        const opciones = trayectos.filter((trayecto) => trayecto.estado !== false
            && punto(trayecto.id_terminal_origen ? 'terminal' : 'gasolinera', trayecto.id_terminal_origen ?? trayecto.id_gasolinera_origen) === desde
            && punto(trayecto.id_terminal_destino ? 'terminal' : 'gasolinera', trayecto.id_terminal_destino ?? trayecto.id_gasolinera_destino) === destino);
        const elegido = opciones.length === 1 ? opciones[0] : opciones.find((item) => String(item.id_trayecto) === String(seleccion[clave]));
        return {
            orden: index + 1, origen: desde, destino, clave, opciones, id_trayecto: elegido?.id_trayecto,
            error: !desde || !destino ? 'Seleccione origen y destino.' : desde === destino
                ? 'Agrupe los productos en una misma entrega; origen y destino no pueden coincidir.'
                : opciones.length === 0 ? 'No hay un trayecto disponible para esta conexión.'
                    : !elegido ? 'Seleccione una de las rutas disponibles.' : null
        };
    });
}

export function prepararViaje({ cabecera, origen, paradas, recorrido }) {
    if (!origen.startsWith('terminal:')) throw new Error('Seleccione el terminal de carga inicial.');
    if (!cabecera.id_vehiculo || !cabecera.id_chofer || !cabecera.fecha_inicio || !cabecera.fecha_fin) {
        throw new Error('Complete los datos del viaje.');
    }
    if (cabecera.fecha_fin <= cabecera.fecha_inicio || cabecera.fecha_fin.slice(0, 10) !== cabecera.fecha_inicio.slice(0, 10)) {
        throw new Error('El fin debe ser posterior al inicio y dentro del mismo día.');
    }
    if (!paradas.length || recorrido.some((tramo) => tramo.error) || !recorrido.length) throw new Error('Complete el recorrido.');
    const combinaciones = new Set();
    const detalles = paradas.flatMap((parada) => {
        if (!parada.productos.length) throw new Error('Cada entrega debe contener al menos un producto.');
        return parada.productos.map((producto) => {
            if (!parada.id_gasolinera || !producto.id_producto_transportado || !/^\d{1,12}(\.\d{1,2})?$/.test(producto.galones) || Number(producto.galones) <= 0) {
                throw new Error('Seleccione el destino, producto y galones mayores que cero en cada entrega.');
            }
            const clave = `${parada.id_gasolinera}:${producto.id_producto_transportado}`;
            if (combinaciones.has(clave)) throw new Error('Agrupe los galones del mismo producto y gasolinera en una sola entrega.');
            combinaciones.add(clave);
            return {
                id_terminal: Number(origen.split(':')[1]), id_gasolinera: Number(parada.id_gasolinera),
                id_producto_transportado: Number(producto.id_producto_transportado), galones: producto.galones
            };
        });
    });
    return {
        ...cabecera, id_vehiculo: Number(cabecera.id_vehiculo), id_chofer: Number(cabecera.id_chofer), detalles,
        tramos: recorrido.map(({ orden, id_trayecto }) => ({ orden, id_trayecto }))
    };
}
