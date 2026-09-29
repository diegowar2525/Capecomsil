const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { validateData } = require("../src/utils/validators/factura_proveedor.validators");

const data = {
    id_proveedor: 1,
    numero_factura: "TEST-1",
    fecha_emision: "2026-09-28",
    detalles: [
        { tipo_concepto: "PRODUCTO", id_producto: 1, descripcion: "Llantas", cantidad: "10", precio_unitario: "20.00", descuento: "10.00", porcentaje_impuesto: "12" },
        { tipo_concepto: "SERVICIO", descripcion: "Reparación", cantidad: "1", precio_unitario: "30.00", porcentaje_impuesto: "0" }
    ]
};

test("Factura: validación de conceptos, decimales y recepción", () => {
    assert.equal(validateData(data).detalles[1].id_producto, null);
    for (const patch of [{ cantidad: 0 }, { precio_unitario: -1 }, { porcentaje_impuesto: undefined }, { porcentaje_impuesto: 101 }, { tipo_concepto: "SERVICIO", id_producto: 1 }]) {
        assert.throws(() => validateData({ ...data, detalles: [{ ...data.detalles[0], ...patch }] }), { status: 400 });
    }
    assert.throws(() => validateData({ ...data, recepcion_inicial: { fecha_recepcion: "2026-09-28", detalles: [{ numero_detalle: 2, cantidad_recibida: 1 }] } }), { status: 400 });
});

test("Factura: HTTP, importes exactos, recepción parcial y rollback integral", async () => {
    const pool = require("../src/config/database");
    const client = await pool.connect();
    const originalConnect = pool.connect;
    const originalQuery = pool.query;
    const model = require("../src/models/factura_proveedor.model");
    const originalEntrada = model.createEntrada;
    let server;
    try {
        await client.query("BEGIN");
        await client.query("CREATE SCHEMA facturas_test_" + process.pid);
        await client.query("SET LOCAL search_path TO facturas_test_" + process.pid + ", public");
        await client.query(fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8"));
        await client.query("INSERT INTO proveedor(nombre) VALUES ('Prueba'); INSERT INTO categoria_producto(nombre) VALUES ('Prueba'); INSERT INTO producto(id_categoria,nombre,unidad_medida) VALUES (1,'Llanta','unidad')");
        pool.query = client.query.bind(client);
        // Cada transacción del servicio se prueba en un savepoint del esquema aislado.
        pool.connect = async () => ({
            release() {},
            query(sql, values) {
                if (sql === "BEGIN") return client.query("SAVEPOINT servicio");
                if (sql === "COMMIT") return client.query("RELEASE SAVEPOINT servicio");
                if (sql === "ROLLBACK") return client.query("ROLLBACK TO SAVEPOINT servicio");
                return client.query(sql, values);
            }
        });
        server = require("../src/app").listen(0, "127.0.0.1");
        await new Promise(resolve => server.once("listening", resolve));
        const url = `http://127.0.0.1:${server.address().port}/api/facturas-proveedor`;
        const post = async body => {
            const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            return { status: response.status, body: await response.json() };
        };
        const first = await post(data);
        assert.equal(first.status, 201);
        assert.equal(first.body.subtotal, "220.00");
        assert.equal(first.body.descuento_total, "10.00");
        assert.equal(first.body.impuestos, "22.80");
        assert.equal(first.body.total, "242.80");
        assert.equal((await client.query("SELECT count(*)::int AS n FROM movimiento_inventario")).rows[0].n, 0);
        const received = { ...data, numero_factura: "TEST-2", recepcion_inicial: { fecha_recepcion: "2026-09-28", detalles: [{ numero_detalle: 1, cantidad_recibida: "4" }] } };
        const second = await post(received);
        assert.equal(second.status, 201);
        assert.equal((await client.query("SELECT cantidad::text FROM movimiento_inventario")).rows[0].cantidad, "4.00");
        assert.equal((await post(received)).status, 409);
        assert.equal((await post({ ...data, numero_factura: "BAD-DISCOUNT", detalles: [{ ...data.detalles[0], descuento: "201" }] })).status, 400);
        assert.equal((await post({ ...received, numero_factura: "BAD-RECEPTION", recepcion_inicial: { ...received.recepcion_inicial, detalles: [{ numero_detalle: 1, cantidad_recibida: "11" }] } })).status, 400);
        // Fallo después de insertar el movimiento: tampoco debe quedar la cabecera.
        model.createEntrada = async (...args) => {
            await originalEntrada(...args);
            throw new Error("Fallo de prueba después del movimiento");
        };
        assert.equal((await post({ ...received, numero_factura: "LATE-FAIL" })).status, 500);
        model.createEntrada = originalEntrada;
        assert.equal((await client.query("SELECT count(*)::int AS n FROM factura_proveedor")).rows[0].n, 2);
        assert.equal((await client.query("SELECT count(*)::int AS n FROM recepcion_compra")).rows[0].n, 1);
        assert.equal((await client.query("SELECT count(*)::int AS n FROM movimiento_inventario")).rows[0].n, 1);
        const rounding = await post({ ...data, numero_factura: "ROUND", detalles: [{ ...data.detalles[1], cantidad: "0.50", precio_unitario: "0.01", porcentaje_impuesto: "50" }] });
        assert.equal(rounding.body.subtotal, "0.01");
        assert.equal(rounding.body.impuestos, "0.01");
        assert.equal(rounding.body.total, "0.02");
        const fetched = await (await fetch(url + "/" + first.body.id_factura_proveedor)).json();
        assert.equal(fetched.detalles[0].precio_unitario, "20.00");
        assert.equal((await fetch(url + "/999999")).status, 404);
        assert.equal((await fetch(url)).status, 200);
    } finally {
        model.createEntrada = originalEntrada;
        pool.connect = originalConnect;
        pool.query = originalQuery;
        if (server) await new Promise(resolve => server.close(resolve));
        await client.query("ROLLBACK");
        client.release();
        await pool.end();
    }
});
