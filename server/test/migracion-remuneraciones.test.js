const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const pool = require("../src/config/database");

test("Migración 012: conserva viajes, modalidades e importes y rechaza viajes de varios días", async () => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query("CREATE SCHEMA migracion_diarias_" + process.pid);
        await client.query("SET LOCAL search_path TO migracion_diarias_" + process.pid + ",public");
        await client.query(`CREATE TABLE chofer(id_chofer integer PRIMARY KEY,tipo_remuneracion text,
                CONSTRAINT chk_chofer_tipo_remuneracion CHECK(tipo_remuneracion IN ('SUELDO','POR_VIAJE')));
            CREATE TABLE viaje(id_viaje integer PRIMARY KEY,id_chofer integer REFERENCES chofer,fecha_inicio timestamp NOT NULL,
                fecha_fin timestamp NOT NULL,estado text,CONSTRAINT chk_viaje_fechas CHECK(fecha_fin>=fecha_inicio));
            CREATE TABLE tarifa(id_tarifa integer PRIMARY KEY,id_gasolinera integer,id_terminal integer,
                valor_por_galon numeric,fecha_inicio date,fecha_fin date);
            CREATE TABLE detalle_viaje(id_viaje integer REFERENCES viaje,id_tarifa integer REFERENCES tarifa);
            CREATE TABLE costo_viaje(id_costo integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,id_viaje integer REFERENCES viaje,
                tipo_costo varchar(100),valor numeric(12,2),descripcion text);
            CREATE FUNCTION validar_fecha_viaje() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
            CREATE TRIGGER viaje_validar_fecha BEFORE UPDATE OF fecha_inicio ON viaje FOR EACH ROW EXECUTE FUNCTION validar_fecha_viaje();
            INSERT INTO chofer VALUES(1,'SUELDO'),(2,'POR_VIAJE');
            INSERT INTO viaje VALUES(1,1,'2026-10-12 08:00','2026-10-12 12:00','REGISTRADO'),
                (2,1,'2026-10-12 13:00','2026-10-13 15:00','REGISTRADO');
            INSERT INTO costo_viaje(id_viaje,tipo_costo,valor) VALUES(1,'PEAJE',5);
            INSERT INTO tarifa VALUES(1,1,1,0.035,'2026-01-01','2026-12-31');
            INSERT INTO detalle_viaje VALUES(1,1);`);
        const migration=fs.readFileSync(path.join(__dirname,"../../database/migrations/012_remuneracion_diaria.sql"),"utf8")
            .replace(/^BEGIN;/m,"").replace(/^COMMIT;/m,"");
        await client.query("SAVEPOINT antes_migracion");
        await assert.rejects(client.query(migration), /viajes de varios días/);
        await client.query("ROLLBACK TO SAVEPOINT antes_migracion");
        await client.query("UPDATE viaje SET fecha_fin='2026-10-12 15:00' WHERE id_viaje=2");
        await client.query(migration);
        assert.deepEqual((await client.query("SELECT tipo_remuneracion FROM chofer ORDER BY id_chofer")).rows.map(r=>r.tipo_remuneracion),["DIARIO_FIJO","DIA_TRABAJADO"]);
        assert.deepEqual((await client.query("SELECT fecha::text FROM viaje ORDER BY id_viaje")).rows.map(r=>r.fecha),["2026-10-12","2026-10-12"]);
        assert.deepEqual((await client.query("SELECT valor FROM costo_viaje WHERE tipo_costo='CHOFER' ORDER BY id_viaje")).rows.map(r=>r.valor),["17.50","17.50"]);
        assert.equal((await client.query("SELECT valor FROM costo_viaje WHERE tipo_costo='PEAJE'")).rows[0].valor,"5.00");
        await client.query("SAVEPOINT fecha_invalida");
        await assert.rejects(client.query("UPDATE viaje SET fecha='2027-01-01' WHERE id_viaje=1"),{constraint:"viaje_tarifa_vigente"});
        await client.query("ROLLBACK TO SAVEPOINT fecha_invalida");
    } finally {
        await client.query("ROLLBACK");
        client.release();
        await pool.end();
    }
});
