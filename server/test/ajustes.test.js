const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("Gastos sin vehículo y ajustes de inventario con signo", async () => {
    const pool = require("../src/config/database");
    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        await client.query("CREATE SCHEMA ajustes_test_" + process.pid);
        await client.query("SET LOCAL search_path TO ajustes_test_" + process.pid + ", public");
        await client.query(fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8"));
        await client.query("INSERT INTO gasto(tipo_gasto,monto) VALUES ('Comida',10)");
        await client.query("INSERT INTO categoria_producto(nombre) VALUES ('Prueba')");
        await client.query("INSERT INTO producto(id_categoria,nombre,unidad_medida) VALUES (1,'Prueba','unidad')");

        for (const [tipo, cantidad] of [["ENTRADA", 10], ["SALIDA", 2], ["AJUSTE", 3], ["AJUSTE", -1]]) {
            await client.query("INSERT INTO movimiento_inventario(id_producto,tipo_movimiento,cantidad,motivo) VALUES (1,$1,$2,'Prueba')", [tipo, cantidad]);
        }

        const result = await client.query("SELECT SUM(CASE WHEN tipo_movimiento='SALIDA' THEN -cantidad ELSE cantidad END) AS stock FROM movimiento_inventario");
        assert.equal(result.rows[0].stock, "10.00");

        for (const [tipo, cantidad] of [["ENTRADA", -1], ["SALIDA", -1], ["AJUSTE", 0], ["ENTRADA", 0], ["SALIDA", 0]]) {
            await client.query("SAVEPOINT invalid_case");
            await assert.rejects(client.query("INSERT INTO movimiento_inventario(id_producto,tipo_movimiento,cantidad,motivo) VALUES (1,$1,$2,'Prueba')", [tipo, cantidad]), { code: "23514" });
            await client.query("ROLLBACK TO SAVEPOINT invalid_case");
        }
    } finally {
        await client.query("ROLLBACK");
        client.release();
        await pool.end();
    }
});
