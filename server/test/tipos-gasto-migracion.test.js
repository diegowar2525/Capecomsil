const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Migración de tipos conserva los gastos históricos y sus importes', async () => {
    const pool = require('../src/config/database');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('CREATE SCHEMA tipos_migracion_' + process.pid);
        await client.query('SET LOCAL search_path TO tipos_migracion_' + process.pid + ',public');
        await client.query(fs.readFileSync(path.join(__dirname,'../../database/schema.sql'),'utf8'));
        await client.query('ALTER TABLE gasto DROP CONSTRAINT gasto_tipo_gasto_fkey; DROP TABLE tipo_gasto');
        await client.query("INSERT INTO gasto(tipo_gasto,monto,descripcion) VALUES ('HISTORICO',12.34,'Conservar')");
        const before = (await client.query('SELECT * FROM gasto')).rows;
        const migration = fs.readFileSync(path.join(__dirname,'../../database/migrations/025_tipos_gasto.sql'),'utf8');
        await client.query(migration.replace(/^BEGIN;\s*/, '').replace(/COMMIT;\s*$/, ''));
        assert.deepEqual((await client.query('SELECT * FROM gasto')).rows,before);
        assert.equal((await client.query("SELECT nombre FROM tipo_gasto WHERE codigo='HISTORICO'")).rows[0].nombre,'HISTORICO');
        assert.equal((await client.query('SELECT count(*) FROM tipo_gasto WHERE reservado')).rows[0].count,'2');
    } finally {
        await client.query('ROLLBACK');
        client.release();
        await pool.end();
    }
});
