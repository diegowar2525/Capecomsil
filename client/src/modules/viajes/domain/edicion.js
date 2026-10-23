import { punto } from './recorrido.js';

// Reconstruye la vista del formulario desde el detalle del viaje consultado.
export function inicializarViaje(viaje) {
    const cabecera = Object.fromEntries(['fecha_inicio', 'fecha_fin', 'id_vehiculo', 'id_chofer']
        .map((key) => [key, viaje?.[key] ?? '']));
    const tramos = [...(viaje?.tramos ?? [])].sort((a, b) => a.orden - b.orden);
    const entregas = viaje?.detalles ?? [];
    const paradas = [];
    const seleccion = {};
    for (const tramo of tramos) {
        const origen = punto(tramo.id_terminal_origen ? 'terminal' : 'gasolinera', tramo.id_terminal_origen ?? tramo.id_gasolinera_origen);
        const destino = punto(tramo.id_terminal_destino ? 'terminal' : 'gasolinera', tramo.id_terminal_destino ?? tramo.id_gasolinera_destino);
        seleccion[`${origen}>${destino}`] = String(tramo.id_trayecto);
        const productos = entregas.filter((detalle) => detalle.id_gasolinera === tramo.id_gasolinera_destino);
        if (productos.length && !paradas.some((parada) => parada.id_gasolinera === String(tramo.id_gasolinera_destino))) {
            paradas.push({ key: `parada-${tramo.id_tramo_viaje}`, id_gasolinera: String(tramo.id_gasolinera_destino),
                productos: productos.map((detalle) => ({ ...detalle, key: `producto-${detalle.id_detalle_viaje}`,
                    id_producto_transportado: String(detalle.id_producto_transportado), galones: String(detalle.galones) })) });
        }
    }
    const primero = tramos[0];
    const ultimo = tramos.at(-1);
    const final = ultimo ? punto(ultimo.id_terminal_destino ? 'terminal' : 'gasolinera', ultimo.id_terminal_destino ?? ultimo.id_gasolinera_destino) : '';
    return { cabecera, paradas, seleccion,
        origen: primero ? punto(primero.id_terminal_origen ? 'terminal' : 'gasolinera', primero.id_terminal_origen ?? primero.id_gasolinera_origen) : '',
        destinoFinal: final === punto('gasolinera', paradas.at(-1)?.id_gasolinera) ? '' : final };
}
