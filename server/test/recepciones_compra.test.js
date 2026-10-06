const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
const { validateData } = require("../src/utils/validators/recepcion_compra.validators");

const data = { id_factura_proveedor: 1, fecha_recepcion: "2026-10-05", detalles: [{ id_detalle_factura_proveedor: 1, cantidad_recibida: "3.00" }] };

test("Recepciones: campos, duplicados y cantidades", () => {
    assert.equal(validateData({ ...data, numero_comprobante: " A-1 " }).numero_comprobante, "A-1");
    for (const patch of [
        { fecha_recepcion: "2026-02-30" }, { numero_comprobante: 1 }, { observacion: [] },
        { detalles: [] }, { detalles: [null] }, { detalles: [...data.detalles, ...data.detalles] },
        { detalles: [{ id_detalle_factura_proveedor: 1, cantidad_recibida: "0" }] }
    ]) assert.throws(() => validateData({ ...data, ...patch }), { status: 400 });
});

test("Recepciones: parciales, integridad, rollback y concurrencia", async () => {
    const pool = require("../src/config/database");
    const connect = pool.connect;
    const query = pool.query;
    const admin = await pool.connect();
    const schema = "recepciones_test_" + process.pid;
    const isolated = new Pool({ ...pool.options, password: pool.options.password, connectionTimeoutMillis: 5000, options: "-c search_path=" + schema + ",public" });
    const model = require("../src/models/movimiento_inventario.model");
    const originalEntrada = model.createEntrada;
    let server;
    try {
        await admin.query("BEGIN");
        await admin.query("CREATE SCHEMA " + schema);
        await admin.query("SET LOCAL search_path TO " + schema + ",public");
        await admin.query(fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8"));
        await admin.query("INSERT INTO proveedor(nombre) VALUES ('Prueba'); INSERT INTO categoria_producto(nombre) VALUES ('Prueba'); INSERT INTO producto(id_categoria,nombre,unidad_medida) VALUES (1,'Filtro','unidad')");
        await admin.query("COMMIT");
        pool.connect = isolated.connect.bind(isolated);
        pool.query = isolated.query.bind(isolated);
        server = require("../src/app").listen(0, "127.0.0.1");
        await new Promise(resolve => server.once("listening", resolve));
        const base = `http://127.0.0.1:${server.address().port}/api`;
        const post = async (route, body) => {
            const response = await fetch(base + route, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            return { status: response.status, body: await response.json() };
        };
        const factura = {
            id_proveedor: 1, numero_factura: "RECEP-1", fecha_emision: "2026-10-01",
            detalles: [
                { tipo_concepto: "PRODUCTO", id_producto: 1, descripcion: "Filtros", cantidad: "10", precio_unitario: "1", porcentaje_impuesto: "0" },
                { tipo_concepto: "SERVICIO", descripcion: "Servicio", cantidad: "1", precio_unitario: "1", porcentaje_impuesto: "0" }
            ],
            recepcion_inicial: { fecha_recepcion: "2026-10-01", detalles: [{ numero_detalle: 1, cantidad_recibida: "4" }] }
        };
        const first = await post("/facturas-proveedor", factura);
        assert.equal(first.status, 201);
        const invoice = first.body.id_factura_proveedor;
        const detail = first.body.detalles[0].id_detalle_factura_proveedor;
        const receipt = cantidad => ({ ...data, id_factura_proveedor: invoice, numero_comprobante: "ENT-2", observacion: "Entrega", detalles: [{ id_detalle_factura_proveedor: detail, cantidad_recibida: cantidad, observacion: "Conforme" }] });
        const receive = body => post("/recepciones-compra", body);
        assert.equal((await receive(receipt("7"))).status, 400);
        assert.equal((await receive({ ...receipt("1"), id_factura_proveedor: 9999 })).status, 404);
        assert.equal((await receive({ ...receipt("1"), detalles: [{ id_detalle_factura_proveedor: first.body.detalles[1].id_detalle_factura_proveedor, cantidad_recibida: 1 }] })).status, 400);
        const other = await post("/facturas-proveedor", { ...factura, numero_factura: "RECEP-2", recepcion_inicial: undefined });
        assert.equal((await receive({ ...receipt("1"), id_factura_proveedor: other.body.id_factura_proveedor })).status, 400);
        await isolated.query("UPDATE factura_proveedor SET estado='ANULADA' WHERE id_factura_proveedor=$1", [invoice]);
        assert.equal((await receive(receipt("1"))).status, 409);
        await isolated.query("UPDATE factura_proveedor SET estado='PAGADA' WHERE id_factura_proveedor=$1", [invoice]);
        // El pago no impide recibir lo comprado.
        const second = await receive(receipt("3"));
        assert.equal(second.status, 201);
        assert.equal(second.body.numero_comprobante, "ENT-2");
        assert.equal(second.body.detalles[0].observacion, "Conforme");
        model.createEntrada = async (...args) => { await originalEntrada(...args); throw new Error("Fallo después de entrada"); };
        assert.equal((await receive(receipt("1"))).status, 500);
        model.createEntrada = originalEntrada;
        assert.equal((await isolated.query("SELECT COUNT(*)::int AS n FROM recepcion_compra")).rows[0].n, 2);
        assert.equal((await isolated.query("SELECT SUM(cantidad)::text AS n FROM movimiento_inventario")).rows[0].n, "7.00");
        const simultaneous = await Promise.all([receive(receipt("2")), receive(receipt("2"))]);
        assert.deepEqual(simultaneous.map(r => r.status).sort(), [201, 400]);
        assert.equal((await receive(receipt("1"))).status, 201);
        assert.equal((await receive(receipt("0.01"))).status, 400);
        assert.equal((await isolated.query("SELECT SUM(cantidad)::text AS n FROM movimiento_inventario")).rows[0].n, "10.00");
        assert.equal((await isolated.query("SELECT COUNT(*)::int AS n FROM recepcion_compra")).rows[0].n, 4);
        // Un registro anulado no consume cantidades pendientes (la reversión es otro módulo).
        await isolated.query("UPDATE recepcion_compra SET estado='ANULADA' WHERE id_recepcion_compra=$1", [second.body.id_recepcion_compra]);
        assert.equal((await receive(receipt("3"))).status, 201);
    } finally {
        model.createEntrada = originalEntrada;
        if (server) await new Promise(resolve => server.close(resolve));
        pool.connect = connect;
        pool.query = query;
        await isolated.end();
        await admin.query("ROLLBACK");
        await admin.query("DROP SCHEMA IF EXISTS " + schema + " CASCADE");
        admin.release();
        await pool.end();
    }
});
