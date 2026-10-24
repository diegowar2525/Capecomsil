import test from 'node:test';
import assert from 'node:assert/strict';
import { prepararVehiculo } from '../src/modules/vehiculos/domain/vehiculo.js';
import * as api from '../src/modules/vehiculos/services/vehiculos.api.js';

test('Vehículos: formulario conserva decimales, fecha local, cero y estado; elimina campos ajenos', () => {
    const form = {
        placa: ' abc-123 ', marca: ' Marca ', modelo: ' Modelo ', anio: '2026',
        capacidad_galones: '8000.50', kilometraje_base: '0', fecha_inicio_control_km: '2026-10-23T08:15:30',
        imagen_url: '', estado: true, id_vehiculo: '999', kilometraje_estimado: '300'
    };
    assert.deepEqual(prepararVehiculo(form), {
        placa: 'ABC-123', marca: 'Marca', modelo: 'Modelo', anio: 2026, capacidad_galones: '8000.50',
        kilometraje_base: '0', fecha_inicio_control_km: '2026-10-23T08:15:30', imagen_url: null, estado: true
    });
    form.estado = false;
    form.fecha_inicio_control_km = '';
    assert.throws(() => prepararVehiculo(form), /juntos/);
    form.kilometraje_base = '';
    const result = prepararVehiculo(form);
    assert.equal(result.estado, false);
    assert.equal(result.kilometraje_base, null);
    assert.equal(result.fecha_inicio_control_km, null);
});

test('Vehículos API: contrato CRUD, cookies, CSRF, cancelación y fecha de kilometraje', async (t) => {
    const calls = [];
    const vehiculo = { id_vehiculo: 3, placa: 'ABC-123' };
    t.mock.method(globalThis, 'fetch', async (url, options) => {
        calls.push({ url, ...options });
        return { ok: true, json: async () => options.method === 'DELETE' ? { vehiculo } : vehiculo };
    });
    const signal = new AbortController().signal;
    await api.listarVehiculos(signal);
    await api.consultarVehiculo(3, signal);
    await api.crearVehiculo({ placa: 'ABC-123' });
    await api.actualizarVehiculo(3, { placa: 'ABC-456' });
    assert.deepEqual(await api.eliminarVehiculo(3), { vehiculo });
    await api.consultarKilometraje(3, '2026-10-23T08:15:30', signal);
    await api.consultarKilometraje(3, '');
    assert.deepEqual(calls.map((call) => call.method), ['GET', 'GET', 'POST', 'PUT', 'DELETE', 'GET', 'GET']);
    assert.equal(calls[0].signal, signal);
    assert.equal(calls[1].url, '/api/vehiculos/3');
    assert.equal(calls[6].url, '/api/vehiculos/3/kilometraje');
    assert.equal(new URL(calls[5].url, 'http://localhost').searchParams.get('fecha_hasta'), '2026-10-23T08:15:30');
    for (const call of calls) assert.equal(call.credentials, 'include');
    for (const call of calls.slice(2, 5)) assert.equal(call.headers['X-CSRF-Protection'], '1');
    assert.deepEqual(JSON.parse(calls[3].body), { placa: 'ABC-456' });
});

test('Vehículos API: errores de sesión, permisos, dependencias y respuesta inválida', async (t) => {
    const mock = t.mock.method(globalThis, 'fetch');
    for (const status of [401, 403, 409]) {
        mock.mock.mockImplementation(async () => ({ ok: false, status, json: async () => ({ message: 'Operación rechazada' }) }));
        await assert.rejects(api.eliminarVehiculo(3), (error) => error.status === status
            && (status === 401 ? /sesión/.test(error.message) : error.message === 'Operación rechazada'));
    }
    mock.mock.mockImplementation(async () => ({ ok: true, json: async () => { throw new Error('HTML'); } }));
    await assert.rejects(api.listarVehiculos(), /respuesta válida/);
});
