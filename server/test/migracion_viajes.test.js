const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("Migración de viajes: conserva relaciones e importes y rechaza cabeceras sin detalles", async () => {
    const pool = require("../src/config/database");
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query("CREATE SCHEMA migracion_viajes_" + process.pid);
        await client.query("SET LOCAL search_path TO migracion_viajes_" + process.pid + ",public");
        // Estructura anterior mínima para verificar la transferencia de datos.
        await client.query(`
            CREATE TABLE tarifa(id_tarifa integer PRIMARY KEY,id_gasolinera integer,id_terminal integer,
                valor_por_galon numeric(12,4),fecha_inicio date,fecha_fin date);
            CREATE TABLE liquidacion(id_liquidacion integer PRIMARY KEY);
            CREATE TABLE viaje(id_viaje integer PRIMARY KEY,id_tarifa integer NOT NULL REFERENCES tarifa,
                id_liquidacion integer REFERENCES liquidacion,fecha timestamp,estado varchar(30) DEFAULT 'PENDIENTE');
            CREATE TABLE detalle_viaje(id_detalle_viaje integer PRIMARY KEY,id_viaje integer REFERENCES viaje,
                galones numeric(14,2),tarifa_aplicada numeric(12,4),valor_transporte numeric(14,2));
            CREATE FUNCTION proteger_historial_tarifa() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
            CREATE TRIGGER tarifa_proteger_historial BEFORE UPDATE ON tarifa FOR EACH ROW EXECUTE FUNCTION proteger_historial_tarifa();
            CREATE FUNCTION validar_vigencia_tarifa_viaje() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
            CREATE TRIGGER viaje_validar_tarifa BEFORE INSERT ON viaje FOR EACH ROW EXECUTE FUNCTION validar_vigencia_tarifa_viaje();
            INSERT INTO tarifa VALUES (1,1,1,0.035,'2026-01-01',NULL);
            INSERT INTO liquidacion VALUES (8);
            INSERT INTO viaje VALUES (1,1,8,'2026-10-08','PENDIENTE'),(2,1,NULL,'2026-10-08','ANULADO');
            INSERT INTO detalle_viaje VALUES (1,1,100,0.035,3.50),(2,1,200,0.035,7.00);
        `);
        const migration = fs.readFileSync(path.join(__dirname, "../../database/migrations/008_viajes_entregas.sql"), "utf8")
            .replace(/^BEGIN;/, "").replace(/COMMIT;\s*$/, "");
        await client.query("SAVEPOINT before_migration");
        await assert.rejects(client.query(migration), /viajes sin detalles/);
        await client.query("ROLLBACK TO SAVEPOINT before_migration");
        await client.query("INSERT INTO detalle_viaje VALUES (3,2,10,0.035,0.35)");
        await client.query(migration);
        const rows = (await client.query("SELECT id_tarifa,id_liquidacion,tarifa_aplicada,valor_transporte FROM detalle_viaje ORDER BY id_detalle_viaje")).rows;
        assert.deepEqual(rows.map(r => r.id_tarifa), [1,1,1]);
        assert.deepEqual(rows.map(r => r.id_liquidacion), [8,8,null]);
        assert.deepEqual(rows.map(r => r.valor_transporte), ["3.50","7.00","0.35"]);
        assert.ok(rows.every(r => r.tarifa_aplicada === "0.0350"));
        assert.deepEqual((await client.query("SELECT estado FROM viaje ORDER BY id_viaje")).rows.map(r => r.estado), ["REGISTRADO","ANULADO"]);
        const columns = (await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='viaje'")).rows.map(r => r.column_name);
        assert.ok(!columns.includes("id_tarifa") && !columns.includes("id_liquidacion"));
        await client.query("SAVEPOINT invalid_change");
        await assert.rejects(client.query("UPDATE tarifa SET valor_por_galon=1"), { code: "23514" });
        await client.query("ROLLBACK TO SAVEPOINT invalid_change");
    } finally {
        await client.query("ROLLBACK");
        client.release();
        await pool.end();
    }
});
