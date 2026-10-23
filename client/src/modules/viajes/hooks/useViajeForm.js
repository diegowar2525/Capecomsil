import { useState } from 'react';
import { construirRecorrido, prepararViaje, punto } from '../domain/recorrido.js';

const nuevoProducto = () => ({ key: crypto.randomUUID(), id_producto_transportado: '', galones: '' });
const nuevaParada = () => ({ key: crypto.randomUUID(), id_gasolinera: '', productos: [nuevoProducto()] });
const opciones = (items, id, label = 'nombre') => items.filter((item) => item.estado !== false)
    .map((item) => ({ value: String(item[id]), label: item[label] }));

export function useViajeForm(catalogos = {}, onPrepare) {
    const { terminales = [], gasolineras = [], vehiculos = [], choferes = [], productos = [], trayectos = [] } = catalogos;
    const [cabecera, setCabecera] = useState({ fecha_inicio: '', fecha_fin: '', id_vehiculo: '', id_chofer: '' });
    const [origen, setOrigen] = useState('');
    const [paradas, setParadas] = useState(() => [nuevaParada()]);
    const [agregarFinal, setAgregarFinal] = useState(false);
    const [destinoFinal, setDestinoFinal] = useState('');
    const [seleccion, setSeleccion] = useState({});
    const [error, setError] = useState('');
    const recorrido = construirRecorrido({ origen, paradas, destinoFinal: agregarFinal ? destinoFinal || 'pendiente:' : '', trayectos, seleccion });
    const lugares = [...opciones(terminales, 'id_terminal').map((item) => ({ ...item, value: punto('terminal', item.value), label: `Terminal: ${item.label}` })),
    ...opciones(gasolineras, 'id_gasolinera').map((item) => ({ ...item, value: punto('gasolinera', item.value), label: `Gasolinera: ${item.label}` }))];
    const nombre = (value) => lugares.find((item) => item.value === value)?.label ?? 'Por seleccionar';
    const actualizarParada = (key, transformar) => setParadas((items) => items.map((item) => item.key === key ? transformar(item) : item));
    const cambiarDestino = (key, value) => actualizarParada(key, (item) => ({ ...item, id_gasolinera: value }));
    const cambiarProducto = (key, productoKey, campo, value) => actualizarParada(key, (parada) => ({
        ...parada,
        productos: parada.productos.map((producto) => producto.key === productoKey ? { ...producto, [campo]: value } : producto)
    }));
    const agregarProducto = (key) => {
        const producto = nuevoProducto();
        actualizarParada(key, (parada) => ({ ...parada, productos: [...parada.productos, producto] }));
    };
    const quitarProducto = (key, productoKey) => actualizarParada(key, (parada) => parada.productos.length === 1 ? parada : ({
        ...parada,
        productos: parada.productos.filter((producto) => producto.key !== productoKey)
    }));
    const agregarEntrega = () => {
        const parada = nuevaParada();
        setParadas((items) => [...items, parada]);
    };
    const quitarEntrega = (key) => setParadas((items) => items.length === 1 ? items : items.filter((item) => item.key !== key));
    const moverEntrega = (index, direccion) => setParadas((items) => {
        if (index + direccion < 0 || index + direccion >= items.length) return items;
        const copia = [...items];
        [copia[index], copia[index + direccion]] = [copia[index + direccion], copia[index]];
        return copia;
    });
    const cambiarCabecera = (campo, value) => setCabecera((actual) => ({ ...actual, [campo]: value }));
    const seleccionarTrayecto = (clave, value) => setSeleccion((actual) => ({ ...actual, [clave]: value }));
    const preparar = () => {
        try {
            const data = prepararViaje({ cabecera, origen, paradas, recorrido });
            setError('');
            onPrepare?.(data);
        } catch (failure) { setError(failure.message); }
    };
    return {
        cabecera, origen, paradas, agregarFinal, destinoFinal, error, recorrido, lugares, nombre,
        sinTerminales: !terminales.length,
        opcionesVehiculos: opciones(vehiculos, 'id_vehiculo', 'placa'), opcionesChoferes: opciones(choferes, 'id_chofer'),
        opcionesGasolineras: opciones(gasolineras, 'id_gasolinera'), opcionesProductos: opciones(productos, 'id_producto_transportado'),
        cambiarCabecera, setOrigen, setAgregarFinal, setDestinoFinal, cambiarDestino, cambiarProducto,
        agregarProducto, quitarProducto, agregarEntrega, quitarEntrega, moverEntrega, seleccionarTrayecto, preparar
    };
}
