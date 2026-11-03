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
        await client.query(fs.readFileSync(path.join(__dirname,'../../database/schema.sql'),'utf8').split('-- Orígenes de gasto y pagos de mantenimiento (029).')[0]);
        await client.query('ALTER TABLE gasto DROP CONSTRAINT gasto_tipo_gasto_fkey; DROP TABLE tipo_gasto');
        await client.query("INSERT INTO gasto(tipo_gasto,monto,descripcion) VALUES ('HISTORICO',12.34,'Conservar')");
        const before = (await client.query('SELECT * FROM gasto')).rows;
        const migration = fs.readFileSync(path.join(__dirname,'../../database/migrations/025_tipos_gasto.sql'),'utf8');
        await client.query(migration.replace(/^BEGIN;\s*/, '').replace(/COMMIT;\s*$/, ''));
        assert.deepEqual((await client.query('SELECT * FROM gasto')).rows,before);
        assert.equal((await client.query("SELECT nombre FROM tipo_gasto WHERE codigo='HISTORICO'")).rows[0].nombre,'HISTORICO');
        assert.equal((await client.query('SELECT count(*) FROM tipo_gasto WHERE reservado')).rows[0].count,'2');
        await client.query("INSERT INTO gasto(tipo_gasto,monto,descripcion) VALUES ('VIATICO',6,'Viático histórico'),('COMBUSTIBLE',20,'Combustible histórico')");
        const nuevosOrigenes = fs.readFileSync(path.join(__dirname,'../../database/migrations/029_origen_gastos_mantenimientos.sql'),'utf8');
        await client.query(nuevosOrigenes.replace(/^BEGIN;\s*/, '').replace(/COMMIT;\s*$/, ''));
        const gastos = (await client.query('SELECT g.*,t.nombre FROM gasto g LEFT JOIN tipo_gasto t USING(id_tipo_gasto) ORDER BY id_gasto')).rows;
        assert.equal(gastos.length,3);
        assert.equal(gastos[0].id_gasto,before[0].id_gasto);
        assert.equal(gastos[0].monto,before[0].monto);
        assert.equal(gastos[0].descripcion,'Conservar');
        assert.equal(gastos[0].nombre,'HISTORICO');
        assert.deepEqual(gastos.map(g=>g.origen),['OPERATIVO','VIATICO','COMBUSTIBLE']);
        assert.equal(gastos[1].monto,'6.00');
        assert.equal(gastos[1].id_tipo_gasto,null);
        assert.equal(gastos[2].monto,'20.00');
        assert.equal((await client.query('SELECT count(*) FROM tipo_gasto')).rows[0].count,'1');
        await client.query("INSERT INTO vehiculo(placa,capacidad_galones) VALUES ('HISTORICO',4000); INSERT INTO mantenimiento(id_vehiculo,fecha_inicio,tipo,monto) VALUES (1,'2026-10-01T08:00:00','Histórico',25)");
        const edicion = fs.readFileSync(path.join(__dirname,'../../database/migrations/030_edicion_mantenimiento.sql'),'utf8');
        await client.query(edicion.replace(/^BEGIN;\s*/, '').replace(/COMMIT;\s*$/, ''));
        const anterior = (await client.query('SELECT * FROM mantenimiento')).rows[0];
        assert.equal(anterior.pago_directo_automatico,false);
        assert.equal(anterior.version,1);
        assert.equal((await client.query('SELECT count(*) FROM gasto')).rows[0].count,'3');
    } finally {
        await client.query('ROLLBACK');
        client.release();
        await pool.end();
    }
});
