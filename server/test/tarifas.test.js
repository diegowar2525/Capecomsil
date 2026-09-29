const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validateData } = require('../src/utils/validators/tarifa.validators');
const data = { id_gasolinera: 1, id_terminal: 1, valor_por_galon: '0.0350', fecha_inicio: '2026-01-01' };

test('validación de fechas reales, precisión monetaria y tipos', () => {
    assert.equal(validateData(data).fecha_fin, null);
    for (const patch of [
        { fecha_inicio: '2026-02-29' }, { fecha_fin: '2025-12-31' },
        { valor_por_galon: '0.03501' }, { valor_por_galon: -1 },
        { valor_por_galon: null }, { id_terminal: true },
        { estado: 'ACTIVO' }, { estado: 'false' }, { estado: null }, { estado: 0 }
    ]) assert.throws(() => validateData({ ...data, ...patch }), { status: 400 });
    assert.equal(validateData(data).estado, true);
    assert.equal(validateData({ ...data, estado: true }).estado, true);
    assert.equal(validateData({ ...data, fecha_inicio: '2024-02-29', estado: false }).estado, false);
});

test('PostgreSQL: períodos e historial (esquema aislado y rollback)', async () => {
    const pool = require('../src/config/database');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('CREATE SCHEMA tarifa_test_' + process.pid);
        await client.query('SET LOCAL search_path TO tarifa_test_' + process.pid + ', public');
        await client.query(fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8'));
        const rejected = async (sql, code) => {
            await client.query('SAVEPOINT invalid_case');
            await assert.rejects(client.query(sql), { code });
            await client.query('ROLLBACK TO SAVEPOINT invalid_case');
        };
        await client.query("INSERT INTO gasolinera(nombre) VALUES ('Prueba'), ('Otra'); INSERT INTO terminal(nombre) VALUES ('Prueba')");
        await client.query(`INSERT INTO tarifa(id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin,estado)
            VALUES (1,1,0.035,'2026-01-01','2026-08-31',false)`);
        await rejected(`INSERT INTO tarifa(id_gasolinera,id_terminal,valor_por_galon,fecha_inicio)
            VALUES (1,1,0.04,'2026-08-31')`, '23P01');
        await client.query(`INSERT INTO tarifa(id_gasolinera,id_terminal,valor_por_galon,fecha_inicio)
            VALUES (1,1,0.04,'2026-09-01'), (2,1,0.05,'2026-01-01')`);
        await rejected("UPDATE tarifa SET fecha_fin='2026-09-01' WHERE id_tarifa=1", '23P01');
        await client.query("INSERT INTO vehiculo(placa,capacidad_galones) VALUES ('TEST',100); INSERT INTO chofer(nombre,cedula) VALUES ('Prueba','TEST')");
        await client.query("INSERT INTO viaje(id_tarifa,id_vehiculo,id_chofer,fecha) VALUES (1,1,1,'2026-05-15 23:59:59')");
        for (const change of ["valor_por_galon=0.04", 'id_gasolinera=2', "fecha_fin='2026-05-14'", "fecha_inicio='2026-05-16'"]) {
            await rejected('UPDATE tarifa SET ' + change + ' WHERE id_tarifa=1', '23514');
        }
        await rejected('DELETE FROM tarifa WHERE id_tarifa=1', '23503');
        await rejected("INSERT INTO viaje(id_tarifa,id_vehiculo,id_chofer,fecha) VALUES (1,1,1,'2026-09-01')", '23514');
        await client.query("UPDATE tarifa SET fecha_fin='2026-05-15', estado=true WHERE id_tarifa=1");
        await client.query('DELETE FROM tarifa WHERE id_gasolinera=2');
        await rejected(`INSERT INTO tarifa(id_gasolinera,id_terminal,valor_por_galon,fecha_inicio)
            VALUES (999,1,0.04,'2027-01-01')`, '23503');
        const model = require('../src/models/tarifa.model');
        const originalQuery = pool.query;
        pool.query = client.query.bind(client);
        try {
            const created = await model.create(validateData({ ...data, id_gasolinera: 2 }));
            assert.equal(created.fecha_inicio, '2026-01-01');
            assert.equal(created.valor_por_galon, '0.0350');
            assert.equal((await model.findById(created.id_tarifa)).estado, true);
            assert.ok((await model.findAll()).length >= 2);
            const updated = await model.update(created.id_tarifa, validateData({ ...data, id_gasolinera: 2, estado: false }));
            assert.equal(updated.estado, false);
            assert.equal((await model.remove(created.id_tarifa)).id_tarifa, created.id_tarifa);
        } finally {
            pool.query = originalQuery;
        }
    } finally {
        await client.query('ROLLBACK');
        client.release();
        await pool.end();
    }
});
