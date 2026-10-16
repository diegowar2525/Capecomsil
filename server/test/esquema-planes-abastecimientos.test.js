const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const pool = require("../src/config/database");

test("Esquema: planes independientes, cumplimiento único y gasto por abastecimiento", async () => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query(`CREATE SCHEMA test_planes_${process.pid}`);
        await client.query(`SET LOCAL search_path TO test_planes_${process.pid},public`);
        await client.query(fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8"));
        await client.query(fs.readFileSync(path.join(__dirname, "../../database/seed.sql"), "utf8")
            .replace(/^BEGIN;/m, "").replace(/^COMMIT;/m, ""));
        const rechazar = async (sql, code) => {
            await client.query("SAVEPOINT invalido");
            await assert.rejects(client.query(sql), error => error.code === code);
            await client.query("ROLLBACK TO SAVEPOINT invalido");
            await client.query("RELEASE SAVEPOINT invalido");
        };
        assert.equal((await client.query("SELECT count(*)::int n FROM plan_mantenimiento_vehiculo")).rows[0].n, 16);
        await client.query(`INSERT INTO mantenimiento(id_vehiculo,fecha_inicio,fecha_fin,tipo,monto)
            VALUES (1,'2026-10-16 08:00','2026-10-16 12:00','Ambos servicios',100)`);
        await client.query(`INSERT INTO cumplimiento_plan_mantenimiento
            (id_mantenimiento,id_plan_mantenimiento_vehiculo,kilometraje_aplicado)
            VALUES (1,1,80000),(1,2,80000)`);
        await rechazar(`INSERT INTO cumplimiento_plan_mantenimiento
            (id_mantenimiento,id_plan_mantenimiento_vehiculo,kilometraje_aplicado)
            VALUES (1,1,80000)`, "23505");
        await rechazar("UPDATE plan_mantenimiento_vehiculo SET intervalo_km=0 WHERE id_plan_mantenimiento_vehiculo=1", "23514");
        await rechazar("DELETE FROM plan_mantenimiento_vehiculo WHERE id_plan_mantenimiento_vehiculo=1", "23503");
        await client.query("INSERT INTO gasto(id_vehiculo,tipo_gasto,monto) VALUES (1,'COMBUSTIBLE',60)");
        const carga = `INSERT INTO abastecimiento_combustible
            (id_vehiculo,id_gasto,fecha_hora,kilometraje_odometro,galones,precio_por_galon,tanque_lleno)
            VALUES (1,1,'2026-10-16 13:00',80000,20,3,true)`;
        await client.query(carga);
        await rechazar(carga, "23505");
        await rechazar("UPDATE abastecimiento_combustible SET galones=0", "23514");
        await rechazar("UPDATE abastecimiento_combustible SET kilometraje_odometro=-1", "23514");
        await rechazar("DELETE FROM gasto WHERE id_gasto=1", "23503");
        assert.equal((await client.query("SELECT count(*)::int n FROM cumplimiento_plan_mantenimiento")).rows[0].n, 2);
    } finally {
        await client.query("ROLLBACK");
        client.release();
        await pool.end();
    }
});
