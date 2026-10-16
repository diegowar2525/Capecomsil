const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const pool = require("../src/config/database");

test("Esquema: recorridos continuos, llantas y materiales externos", async () => {
    const client = await pool.connect();
    const schema = `test_recorridos_${process.pid}`;
    try {
        await client.query("BEGIN");
        await client.query(`CREATE SCHEMA ${schema}`);
        await client.query(`SET LOCAL search_path TO ${schema}, public`);
        await client.query(fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8"));
        const seed = fs.readFileSync(path.join(__dirname, "../../database/seed.sql"), "utf8")
            .replace(/^BEGIN;/m, "").replace(/^COMMIT;/m, "");
        await client.query(seed);
        for (const [tabla, esperado] of Object.entries({ terminal: 5, gasolinera: 17, vehiculo: 8, chofer: 7, tarifa: 42, trayecto: 248 })) {
            assert.equal((await client.query(`SELECT count(*)::int n FROM ${tabla}`)).rows[0].n, esperado);
        }
        assert.equal((await client.query("SELECT count(*)::int n FROM tarifa WHERE valor_por_galon <= 0 OR fecha_inicio <> DATE '2026-01-01' OR fecha_fin <> DATE '2026-12-31'")).rows[0].n, 0);
        assert.equal((await client.query("SELECT count(*)::int n FROM trayecto WHERE observacion NOT LIKE 'ESTIMACIÓN DE PRUEBA:%'")).rows[0].n, 0);
        const grados = (await client.query(`SELECT id_gasolinera_origen,COUNT(*)::int n,
            COUNT(DISTINCT id_gasolinera_destino)::int destinos FROM trayecto
            WHERE id_gasolinera_origen IS NOT NULL AND id_gasolinera_destino IS NOT NULL
            GROUP BY id_gasolinera_origen`)).rows;
        assert.equal(grados.length, 14);
        assert.ok(grados.every(r => r.n === 13 && r.destinos === 13));
        assert.equal((await client.query(`SELECT count(*)::int n FROM trayecto t
            WHERE t.id_gasolinera_origen IS NOT NULL AND t.id_gasolinera_destino IS NOT NULL
            AND (t.id_gasolinera_origen=t.id_gasolinera_destino OR t.kilometros<=0 OR NOT EXISTS (
                SELECT 1 FROM trayecto r WHERE r.id_gasolinera_origen=t.id_gasolinera_destino
                    AND r.id_gasolinera_destino=t.id_gasolinera_origen))`)).rows[0].n, 0);
        const entreGasolineras = (await client.query(`SELECT o.nombre AS origen,d.nombre AS destino,t.kilometros
            FROM trayecto t JOIN gasolinera o ON o.id_gasolinera=t.id_gasolinera_origen
            JOIN gasolinera d ON d.id_gasolinera=t.id_gasolinera_destino
            WHERE o.nombre IN ('CECILIA','MECHITA') AND d.nombre IN ('CECILIA','MECHITA') ORDER BY o.nombre`)).rows;
        assert.deepEqual(entreGasolineras.map(r => r.kilometros), ["1.40", "1.00"]);
        const mechita = (await client.query(`SELECT t.kilometros FROM trayecto t
            JOIN gasolinera g ON g.id_gasolinera=t.id_gasolinera_origen
            JOIN terminal te ON te.id_terminal=t.id_terminal_destino
            WHERE g.nombre='MECHITA' AND te.nombre='Terminal La Troncal'`)).rows[0];
        assert.equal(mechita.kilometros, "11.00");
        await client.query("SAVEPOINT seed_repetido");
        await assert.rejects(client.query(seed), /catálogos vacíos/);
        await client.query("ROLLBACK TO SAVEPOINT seed_repetido");
        const invalid = async (sql) => {
            await client.query("SAVEPOINT invalid_case");
            await assert.rejects(async () => {
                await client.query(sql);
                await client.query("SET CONSTRAINTS ALL IMMEDIATE");
            }, { code: "23514" });
            await client.query("ROLLBACK TO SAVEPOINT invalid_case");
        };
        await invalid("INSERT INTO producto(id_categoria,nombre,unidad_medida) VALUES (1,'Llanta sin condición','unidad')");
        await invalid("INSERT INTO producto(id_categoria,nombre,unidad_medida,condicion_llanta) VALUES (2,'Aceite','galón','NUEVA')");
        await client.query("INSERT INTO viaje(id_vehiculo,id_chofer,fecha_inicio,fecha_fin) VALUES (1,1,'2026-10-01 08:00','2026-10-01 09:00')");
        const salida = (await client.query("INSERT INTO trayecto(nombre,id_gasolinera_origen,id_terminal_destino,kilometros) VALUES ('Salida',1,1,20) RETURNING id_trayecto")).rows[0].id_trayecto;
        const llegada = (await client.query("INSERT INTO trayecto(nombre,id_terminal_origen,id_gasolinera_destino,kilometros) VALUES ('Llegada',1,2,80) RETURNING id_trayecto")).rows[0].id_trayecto;
        await client.query("INSERT INTO configuracion_peaje_trayecto(id_trayecto,importe,fecha_inicio) SELECT id_trayecto,0,'2026-01-01' FROM trayecto");
        await client.query("INSERT INTO tramo_viaje(id_viaje,orden,id_trayecto,id_configuracion_peaje_trayecto,peaje_aplicado) SELECT 1,CASE WHEN id_trayecto=$1 THEN 1 ELSE 2 END,id_trayecto,id_configuracion_peaje_trayecto,importe FROM configuracion_peaje_trayecto WHERE id_trayecto IN ($1,$2)", [salida, llegada]);
        await client.query("SET CONSTRAINTS ALL IMMEDIATE");
        assert.equal((await client.query("SELECT sum(kilometros) AS km FROM tramo_viaje")).rows[0].km, "100.00");
        await invalid(`UPDATE trayecto SET id_terminal_origen=2 WHERE id_trayecto=${llegada}`);

        await invalid("DELETE FROM tramo_viaje WHERE orden=1");
        await client.query("INSERT INTO mantenimiento(id_vehiculo,fecha_inicio,fecha_fin,tipo,monto) VALUES (1,'2026-10-01 09:00','2026-10-01 10:00','Prueba',10)");
        await client.query(`INSERT INTO detalle_mantenimiento(id_mantenimiento,origen_producto,descripcion_producto,cantidad)
            VALUES (1,'EXTERNO','Llanta del taller',1)`);
        await invalid(`INSERT INTO movimiento_inventario(id_producto,tipo_movimiento,cantidad,motivo,id_detalle_mantenimiento)
            VALUES (1,'SALIDA',1,'Prueba',1)`);
        await invalid("UPDATE detalle_mantenimiento SET descripcion_producto=' ' WHERE id_detalle_mantenimiento=1");
        await client.query("SET CONSTRAINTS ALL IMMEDIATE");
    } finally {
        await client.query("ROLLBACK");
        client.release();
        await pool.end();
    }
});
