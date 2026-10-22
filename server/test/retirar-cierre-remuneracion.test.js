const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const pool = require("../src/config/database");

test("Migración 019: retira cierre, conserva remuneraciones y costos y permite recalcular", async () => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query(`CREATE SCHEMA retirar_cierre_${process.pid}`);
        await client.query(`SET LOCAL search_path TO retirar_cierre_${process.pid},public`);
        const schema = fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8");
        await client.query(schema);
        // Restaurar los objetos anteriores desde la migración histórica inalterada.
        const original = fs.readFileSync(path.join(__dirname, "../../database/migrations/012_remuneracion_diaria.sql"), "utf8");
        await client.query(`ALTER TABLE remuneracion_chofer
            ADD COLUMN estado VARCHAR(10) NOT NULL DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO','CERRADO')),
            ADD COLUMN fecha_cierre TIMESTAMP,
            ADD CHECK ((estado='ABIERTO' AND fecha_cierre IS NULL) OR (estado='CERRADO' AND fecha_cierre IS NOT NULL))`);
        await client.query(original.match(/CREATE TABLE historial_remuneracion_chofer \([\s\S]*?\n\);/)[0]);
        await client.query(original.match(/CREATE FUNCTION proteger_cierre_remuneracion\(\)[\s\S]*?EXECUTE FUNCTION proteger_cierre_remuneracion\(\);/)[0]);
        const calculoAnterior = schema.match(/CREATE FUNCTION recalcular_remuneracion\([\s\S]*?\n\$\$;/)[0]
            .replace("CREATE FUNCTION", "CREATE OR REPLACE FUNCTION")
            .replace("    IF FOUND THEN\n", "    IF FOUND THEN\n" + original.match(/        IF r.estado='CERRADO' THEN[\s\S]*?        END IF;\n/)[0]);
        await client.query(calculoAnterior);
        await client.query(`INSERT INTO configuracion_remuneracion(importe_diario,adicional_dia_especial,fecha_inicio) VALUES (35,35,'2026-01-01');
            INSERT INTO chofer(nombre,cedula,tipo_remuneracion) VALUES ('Prueba','TEST','DIARIO_FIJO');
            INSERT INTO vehiculo(placa,capacidad_galones) VALUES ('TEST',100);
            INSERT INTO terminal(nombre) VALUES ('T'); INSERT INTO gasolinera(nombre) VALUES ('G');
            INSERT INTO trayecto(nombre,id_terminal_origen,id_gasolinera_destino,kilometros) VALUES ('T-G',1,1,10);
            INSERT INTO configuracion_peaje_trayecto(id_trayecto,importe,fecha_inicio) VALUES (1,0,'2026-01-01');
            INSERT INTO viaje(id_vehiculo,id_chofer,fecha_inicio,fecha_fin) VALUES (1,1,'2026-10-20 08:00','2026-10-20 09:00');
            INSERT INTO tramo_viaje(id_viaje,orden,id_trayecto,kilometros,id_configuracion_peaje_trayecto,peaje_aplicado) VALUES (1,1,1,10,1,0);
            SELECT recalcular_remuneracion(1,'2026-10-20');
            INSERT INTO historial_remuneracion_chofer(id_remuneracion_chofer,accion,motivo,responsable)
                VALUES (1,'CIERRE','Registro de prueba','Prueba');
            ALTER TABLE remuneracion_chofer DISABLE TRIGGER remuneracion_cierre_bloqueado;
            UPDATE remuneracion_chofer SET estado='CERRADO',fecha_cierre=CURRENT_TIMESTAMP;
            ALTER TABLE remuneracion_chofer ENABLE TRIGGER remuneracion_cierre_bloqueado;`);
        await client.query("SAVEPOINT cierre_anterior");
        await assert.rejects(client.query("SELECT recalcular_remuneracion(1,'2026-10-20')"), { constraint: "remuneracion_cerrada" });
        await client.query("ROLLBACK TO SAVEPOINT cierre_anterior");
        const antes = (await client.query("SELECT to_jsonb(r)-ARRAY['estado','fecha_cierre'] AS datos FROM remuneracion_chofer r")).rows;
        const costos = (await client.query("SELECT * FROM costo_viaje ORDER BY id_costo")).rows;
        assert.equal(costos[0].valor, "35.00");
        await client.query("SET CONSTRAINTS ALL IMMEDIATE");
        const migration = fs.readFileSync(path.join(__dirname, "../../database/migrations/019_retirar_cierre_remuneracion.sql"), "utf8");
        await client.query(migration.replace(/^BEGIN;\s*/, "").replace(/COMMIT;\s*$/, ""));
        assert.deepEqual((await client.query("SELECT to_jsonb(r) AS datos FROM remuneracion_chofer r")).rows, antes);
        assert.deepEqual((await client.query("SELECT * FROM costo_viaje ORDER BY id_costo")).rows, costos);
        assert.equal((await client.query("SELECT to_regclass(current_schema() || '.historial_remuneracion_chofer') AS tabla")).rows[0].tabla, null);
        assert.equal((await client.query("SELECT recalcular_remuneracion(1,'2026-10-20') AS id")).rows[0].id, 1);
        assert.deepEqual((await client.query("SELECT * FROM costo_viaje ORDER BY id_costo")).rows, costos);
        assert.equal((await client.query("SELECT count(*)::int n FROM permiso WHERE codigo LIKE 'cierres.%'")).rows[0].n, 3);
    } finally {
        await client.query("ROLLBACK");
        client.release();
        await pool.end();
    }
});
