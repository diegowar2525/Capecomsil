const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { validateData } = require("../src/utils/validators/chofer.validators");

test("Remuneración: normalización y opciones obligatorias", () => {
    const data = { nombre: "Prueba", cedula: "123" };
    for (const [value, expected] of [[" sueldo ", "SUELDO"], [" por_viaje ", "POR_VIAJE"]]) {
        assert.equal(validateData({ ...data, tipo_remuneracion: value }).tipo_remuneracion, expected);
    }
    for (const value of [undefined, null, true, 1, "", "MENSUAL", "POR VIAJE"]) {
        assert.throws(() => validateData({ ...data, tipo_remuneracion: value }), { status: 400 });
    }
});

test("PostgreSQL: remuneración obligatoria y restringida", async () => {
    const pool = require("../src/config/database");
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query("CREATE SCHEMA remuneracion_test_" + process.pid);
        await client.query("SET LOCAL search_path TO remuneracion_test_" + process.pid + ", public");
        await client.query(fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8"));
        await client.query("INSERT INTO chofer(nombre,cedula,tipo_remuneracion) VALUES ('Prueba','1','SUELDO'), ('Prueba','2','POR_VIAJE')");
        for (const [value, code] of [[null, "23502"], ["OTRO", "23514"]]) {
            await client.query("SAVEPOINT invalid_case");
            await assert.rejects(client.query("UPDATE chofer SET tipo_remuneracion=$1 WHERE cedula='1'", [value]), { code });
            await client.query("ROLLBACK TO SAVEPOINT invalid_case");
        }
    } finally {
        await client.query("ROLLBACK");
        client.release();
        await pool.end();
    }
});
