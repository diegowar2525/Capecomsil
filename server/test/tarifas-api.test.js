const { test } = require('node:test');
const assert = require('node:assert/strict');
const model = require('../src/models/tarifa.model');
const pool = require('../src/config/database');
const app = require('../src/app');

test('API: rutas, validación y traducción de errores', async () => {
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api/tarifas`;
    const original = { ...model };
    const body = { id_gasolinera: 1, id_terminal: 1, valor_por_galon: '0.035', fecha_inicio: '2026-01-01' };
    const request = (method, suffix = '', value = body) => fetch(base + suffix, {
        method, headers: { 'Content-Type': 'application/json' },
        ...(method === 'GET' || method === 'DELETE' ? {} : { body: JSON.stringify(value) })
    });
    try {
        model.findAll = async () => [];
        assert.equal((await request('GET')).status, 200);
        model.findById = async () => undefined;
        assert.equal((await request('GET', '/1')).status, 404);
        assert.equal((await request('GET', '/abc')).status, 400);
        model.create = async data => ({ id_tarifa: 1, ...data });
        assert.equal((await request('POST')).status, 201);
        assert.equal((await request('POST', '', {})).status, 400);
        model.update = async () => { throw { code: '23514', constraint: 'tarifa_historial' }; };
        assert.equal((await request('PUT', '/1')).status, 409);
        model.create = async () => { throw { code: '23P01', constraint: 'tarifa_sin_solapamientos' }; };
        assert.equal((await request('POST')).status, 409);
        model.remove = async () => { throw { code: '23503', constraint: 'fk_detalle_viaje_tarifa', table: 'viaje' }; };
        assert.equal((await request('DELETE', '/1')).status, 409);
        model.create = async () => { throw { code: '23503', constraint: 'fk_tarifa_terminal' }; };
        assert.equal((await request('POST')).status, 400);
        model.create = async () => {
            throw { code: '23503', constraint: 'fk_otra_entidad', message: 'Detalle SQL privado' };
        };
        const unknown = await request('POST');
        assert.equal(unknown.status, 500);
        assert.deepEqual(await unknown.json(), { message: 'Error interno del servidor' });
    } finally {
        Object.assign(model, original);
        await new Promise(resolve => server.close(resolve));
        await pool.end();
    }
});
