const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
const { validateData } = require("../src/utils/validators/mantenimiento.validators");

const body = { id_vehiculo: 1, fecha: "2026-10-05", tipo: "Cambio de filtros", monto: "25.00", detalles: [{ id_producto: 1, cantidad: "2.00" }] };

test("Mantenimiento: cantidades, referencias y datos obligatorios", () => {
    assert.equal(validateData(body).id_proveedor, null);
    assert.deepEqual(validateData({ ...body, detalles: [] }).detalles, []);
    for (const change of [
        { monto: -1 }, { monto: true }, { fecha: "2026-02-30" }, { tipo: " " },
        { detalles: null }, { detalles: [null] }, { detalles: [...body.detalles, ...body.detalles] },
        { detalles: [{ id_producto: 1, cantidad: 0 }] }
    ]) assert.throws(() => validateData({ ...body, ...change }), { status: 400 });
});

test("Mantenimiento: API, salidas, rollback y consumo concurrente", async () => {
    const pool = require("../src/config/database");
    const originalConnect = pool.connect;
    const originalQuery = pool.query;
    const admin = await pool.connect();
    const schema = "mantenimiento_test_" + process.pid;
    const isolated = new Pool({
        ...pool.options,
        password: pool.options.password,
        connectionTimeoutMillis: 5000,
        options: "-c search_path=" + schema + ",public"
    });
    const movimientoModel = require("../src/models/movimiento_inventario.model");
    const originalSalida = movimientoModel.createSalida;
    let server;
    try {
        await admin.query("BEGIN");
        await admin.query("CREATE SCHEMA " + schema);
        await admin.query("SET LOCAL search_path TO " + schema + ", public");
        await admin.query(fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8"));
        await admin.query("INSERT INTO vehiculo(placa,capacidad_galones) VALUES ('TEST',100); INSERT INTO categoria_producto(nombre) VALUES ('Test'); INSERT INTO producto(id_categoria,nombre,unidad_medida) VALUES (1,'Filtro','unidad'),(1,'Llanta','unidad'); INSERT INTO movimiento_inventario(id_producto,tipo_movimiento,cantidad,motivo) VALUES (1,'ENTRADA',5,'Inicial'),(2,'ENTRADA',3,'Inicial')");
        await admin.query("COMMIT");
        pool.connect = isolated.connect.bind(isolated);
        pool.query = isolated.query.bind(isolated);
        server = require("../src/app").listen(0, "127.0.0.1");
        await new Promise(resolve => server.once("listening", resolve));
        const url = `http://127.0.0.1:${server.address().port}/api/mantenimientos`;
        const post = async data => {
            const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
            return { status: response.status, body: await response.json() };
        };
        const created = await post(body);
        assert.equal(created.status, 201);
        assert.equal(created.body.detalles.length, 1);
        const fetched = await (await fetch(url + "/" + created.body.id_mantenimiento)).json();
        assert.equal(fetched.detalles[0].nombre_producto, "Filtro");
        assert.equal((await fetch(url)).status, 200);
        assert.equal((await fetch(url + "/9999")).status, 404);
        assert.equal((await fetch(url + "/abc")).status, 400);
        const movement = (await isolated.query("SELECT * FROM movimiento_inventario WHERE tipo_movimiento='SALIDA'")).rows[0];
        assert.equal(movement.id_detalle_mantenimiento, created.body.detalles[0].id_detalle_mantenimiento);
        assert.equal(movement.cantidad, "2.00");
        assert.equal((await post({ ...body, id_vehiculo: 9999 })).status, 400);
        assert.equal((await post({ ...body, id_proveedor: 9999 })).status, 400);
        assert.equal((await post({ ...body, detalles: [{ id_producto: 9999, cantidad: 1 }] })).status, 400);
        assert.equal((await post({ ...body, detalles: [{ id_producto: 1, cantidad: 4 }] })).status, 409);
        // Fallo después de guardar una salida: no debe persistir ninguna parte.
        movimientoModel.createSalida = async (...args) => {
            await originalSalida(...args);
            throw new Error("Fallo simulado después de salida");
        };
        assert.equal((await post(body)).status, 500);
        movimientoModel.createSalida = originalSalida;
        assert.equal((await isolated.query("SELECT COUNT(*)::int AS n FROM mantenimiento")).rows[0].n, 1);
        assert.equal((await isolated.query("SELECT COUNT(*)::int AS n FROM detalle_mantenimiento")).rows[0].n, 1);
        assert.equal((await isolated.query("SELECT COUNT(*)::int AS n FROM movimiento_inventario WHERE tipo_movimiento='SALIDA'")).rows[0].n, 1);
        const simultaneous = await Promise.all([post(body), post(body)]);
        assert.deepEqual(simultaneous.map(r => r.status).sort(), [201, 409]);
        const stock = (await isolated.query("SELECT SUM(CASE WHEN tipo_movimiento='SALIDA' THEN -cantidad ELSE cantidad END)::text AS saldo FROM movimiento_inventario WHERE id_producto=1")).rows[0].saldo;
        assert.equal(stock, "1.00");
        assert.equal((await post({ ...body, detalles: [] })).status, 201);
        const removed = await isolated.query("SELECT 1 FROM information_schema.columns WHERE table_schema=$1 AND table_name='factura_proveedor' AND column_name='detalle'", [schema]);
        assert.equal(removed.rowCount, 0);
    } finally {
        movimientoModel.createSalida = originalSalida;
        if (server) await new Promise(resolve => server.close(resolve));
        pool.connect = originalConnect;
        pool.query = originalQuery;
        await isolated.end();
        await admin.query("ROLLBACK");
        // Nombre fijo generado arriba, exclusivo de esta prueba.
        await admin.query("DROP SCHEMA IF EXISTS " + schema + " CASCADE");
        admin.release();
        await pool.end();
    }
});
