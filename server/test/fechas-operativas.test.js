const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pool = require('../src/config/database');

test('Migración 038 conserva el día original, registros y retira horarios', async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`CREATE SCHEMA fechas_operativas_${process.pid}`);
        await client.query(`SET LOCAL search_path TO fechas_operativas_${process.pid},public`);
        const schema = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
        await client.query(schema.split('-- Evolución: fecha única de viajes y mantenimientos.')[0]);
        await client.query(`
            INSERT INTO vehiculo(placa,capacidad_galones) VALUES ('FECHA',4000);
            INSERT INTO chofer(nombre,cedula,tipo_remuneracion) VALUES ('Fecha','F','DIA_TRABAJADO');
            INSERT INTO viaje(id_vehiculo,id_chofer,fecha_inicio,fecha_fin,estado)
            VALUES (1,1,'2026-10-05 23:00','2026-10-05 23:59','ANULADO');
            INSERT INTO terminal(nombre) VALUES ('Origen');
            INSERT INTO gasolinera(nombre) VALUES ('Destino');
            INSERT INTO trayecto(nombre,id_terminal_origen,id_gasolinera_destino,kilometros)
            VALUES ('Recorrido',1,1,10);
            INSERT INTO configuracion_peaje_trayecto(id_trayecto,importe,fecha_inicio)
            VALUES (1,0,'2026-01-01');
            INSERT INTO tramo_viaje(id_viaje,orden,id_trayecto,kilometros,id_configuracion_peaje_trayecto,peaje_aplicado)
            VALUES (1,1,1,10,1,0);
            INSERT INTO mantenimiento(id_vehiculo,fecha_inicio,fecha_fin,tipo,monto,clase)
            VALUES (1,'2026-10-06 23:30','2026-10-08 08:00','Servicio',0,'CORRECTIVO');
        `);
        await client.query('SET CONSTRAINTS ALL IMMEDIATE');
        const sql = fs.readFileSync(path.join(__dirname, '../../database/migrations/038_fechas_operativas.sql'), 'utf8');
        await client.query(sql.replace(/BEGIN;/, '').replace(/COMMIT;\s*$/, ''));
        for (const [table, day] of [['viaje', '2026-10-05'], ['mantenimiento', '2026-10-06']]) {
            const { rows } = await client.query(`SELECT fecha_inicio::text AS fecha, pg_typeof(fecha_inicio)::text AS tipo FROM ${table}`);
            assert.deepEqual(rows, [{ fecha: day, tipo: 'date' }]);
            const cols = await client.query(`SELECT column_name FROM information_schema.columns
                WHERE table_schema=current_schema() AND table_name=$1 AND column_name='fecha_fin'`, [table]);
            assert.equal(cols.rowCount, 0);
        }
        assert.equal((await client.query('SELECT estado FROM viaje')).rows[0].estado, 'ANULADO');
        const triggers = await client.query(`SELECT tgname FROM pg_trigger WHERE tgrelid IN ('viaje'::regclass,'mantenimiento'::regclass)
            AND tgname IN ('viaje_disponibilidad','mantenimiento_disponibilidad')`);
        assert.equal(triggers.rowCount, 0);
    } finally {
        await client.query('ROLLBACK');
        client.release();
        await pool.end();
    }
});
