import { test } from 'node:test';
import assert from 'node:assert/strict';
import { construirRecorrido, prepararViaje } from '../src/modules/viajes/domain/recorrido.js';

const trayectos = [
    { id_trayecto: 1, id_terminal_origen: 1, id_gasolinera_destino: 2 },
    { id_trayecto: 2, id_gasolinera_origen: 2, id_gasolinera_destino: 3 },
    { id_trayecto: 3, id_gasolinera_origen: 3, id_terminal_destino: 1 }
];
const paradas = [2, 3].map((id_gasolinera) => ({ id_gasolinera, productos: [{ id_producto_transportado: 1, galones: '10.50' }] }));
const datos = { origen: 'terminal:1', paradas, trayectos };

test('Encadena entregas y termina en la última; retorno opcional sin entrega adicional', () => {
    const recorrido = construirRecorrido(datos);
    assert.deepEqual(recorrido.map((t) => [t.orden, t.id_trayecto]), [[1, 1], [2, 2]]);
    const retorno = construirRecorrido({ ...datos, destinoFinal: 'terminal:1' });
    assert.equal(retorno[2].id_trayecto, 3);
    const payload = prepararViaje({ ...datos, recorrido: retorno, cabecera: { id_vehiculo: '1', id_chofer: '2', fecha_inicio: '2026-10-22T08:00', fecha_fin: '2026-10-22T10:00' } });
    assert.equal(payload.detalles.length, 2);
    assert.equal(payload.tramos.length, 3);
    assert.ok(payload.detalles.every((d) => d.id_terminal === 1));
});

test('Cambiar o quitar paradas reconstruye conexiones y descarta selecciones incompatibles', () => {
    const recorrido = construirRecorrido({ ...datos, paradas: [paradas[1]], seleccion: { 'terminal:1>gasolinera:2': 1 } });
    assert.equal(recorrido[0].id_trayecto, undefined);
    assert.ok(recorrido[0].error);
    assert.ok(construirRecorrido({ ...datos, paradas: [...paradas].reverse() }).some((t) => t.error));
});

test('Rutas ambiguas requieren elección y trayectos inactivos no se usan', () => {
    const alternativas = [...trayectos, { ...trayectos[0], id_trayecto: 4 }];
    assert.ok(construirRecorrido({ ...datos, trayectos: alternativas })[0].error);
    assert.equal(construirRecorrido({ ...datos, trayectos: alternativas, seleccion: { 'terminal:1>gasolinera:2': 4 } })[0].id_trayecto, 4);
    assert.ok(construirRecorrido({ ...datos, trayectos: [{ ...trayectos[0], estado: false }] })[0].error);
});

test('Varios productos en una parada no crean tramos adicionales; rechaza destinos consecutivos iguales', () => {
    const multiples = [{ ...paradas[0], productos: [...paradas[0].productos, { id_producto_transportado: 2, galones: '5' }] }];
    assert.equal(construirRecorrido({ ...datos, paradas: multiples }).length, 1);
    assert.ok(construirRecorrido({ ...datos, destinoFinal: 'gasolinera:3' }).at(-1).error);
});
