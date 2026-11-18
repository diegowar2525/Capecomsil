const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pool = require('../src/config/database');
const { createEnTransaccion } = require('../src/services/documentos_historicos.service');

test('Bancos: migración sin alterar cobros, duplicados, inactivos e historial', async () => {
    const c = await pool.connect();
    const schema = 'bancos_test_' + process.pid;
    try {
        await c.query(`CREATE SCHEMA ${schema}; SET search_path TO ${schema},public`);
        const sql = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
        await c.query(sql.split('-- Bancos de cobros (043).')[0]);
        await c.query("INSERT INTO empresa(nombre) VALUES('Cliente de prueba')");
        const f = await createEnTransaccion(c, 'CLIENTE', { id_empresa: 1, numero_factura: 'BANCO-1',
            fecha_emision: '2026-01-01', fecha_corte: '2026-01-01', total: '100', retencion: '0', importe_pagado_previo: '0',
            archivo_origen: 'prueba', hoja_origen: 'prueba', fila_origen: 1, huella_origen: 'a'.repeat(64) });
        const insert = (banco) => c.query("INSERT INTO pago(id_factura,fecha_pago,monto,forma_pago,banco) VALUES($1,'2026-01-02',1,'EFECTIVO',$2) RETURNING *", [f.id_factura, banco]);
        await insert(' Banco   Uno ');
        await insert('banco uno');
        const before = (await c.query('SELECT * FROM pago ORDER BY id_pago')).rows;
        await c.query('BEGIN');
        await c.query(fs.readFileSync(path.join(__dirname, '../../database/migrations/043_bancos.sql'), 'utf8'));
        await c.query('COMMIT');
        const after = (await c.query('SELECT * FROM pago ORDER BY id_pago')).rows;
        assert.deepEqual(after.map(({ id_banco, ...row }) => row), before);
        assert.equal(after[0].id_banco, after[1].id_banco);
        assert.equal((await c.query('SELECT count(*) FROM banco')).rows[0].count, '1');
        await assert.rejects(c.query("INSERT INTO banco(nombre) VALUES(' BANCO  UNO ')"), { code: '23505' });
        const id = after[0].id_banco;
        await c.query("UPDATE banco SET nombre='Banco renombrado' WHERE id_banco=$1", [id]);
        const pago = await require('../src/models/cobro_cliente.model').create(c, {
            id_factura: f.id_factura, fecha_pago: '2026-01-03', monto: 1, forma_pago: 'EFECTIVO', id_banco: id
        }, null);
        assert.equal((await c.query('SELECT banco FROM pago WHERE id_pago=$1', [pago.id_pago])).rows[0].banco, 'Banco renombrado');
        assert.equal((await c.query('SELECT banco FROM pago WHERE id_pago=1')).rows[0].banco, ' Banco   Uno ');
        await assert.rejects(c.query('DELETE FROM banco WHERE id_banco=$1', [id]), { code: '23503' });
        await c.query('UPDATE banco SET estado=false WHERE id_banco=$1', [id]);
        await assert.rejects(insert('Banco renombrado'), { constraint: 'banco_activo' });
        await c.query("UPDATE pago SET estado='ANULADO',fecha_anulacion=now(),motivo_anulacion='Prueba' WHERE id_pago=1");
        await assert.rejects(c.query("UPDATE pago SET banco='Otro' WHERE id_pago=2"), { constraint: 'cobro_cliente_historial' });
    } finally {
        await c.query('ROLLBACK');
        await c.query('SET search_path TO public');
        await c.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
        c.release();
        await pool.end();
    }
});
