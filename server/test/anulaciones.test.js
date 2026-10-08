const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

test("Anulaciones: historial, stock, pendientes, rollback y doble reversión concurrente", async () => {
    const pool = require("../src/config/database");
    const connect = pool.connect;
    const query = pool.query;
    const admin = await pool.connect();
    const schema = "anulaciones_test_" + process.pid;
    const isolated = new Pool({ ...pool.options, password: pool.options.password, options: "-c search_path=" + schema + ",public" });
    const model = require("../src/models/movimiento_inventario.model");
    const original = model.createReversion;
    let server;
    try {
        await admin.query("BEGIN");
        await admin.query("CREATE SCHEMA " + schema);
        await admin.query("SET LOCAL search_path TO " + schema + ",public");
        await admin.query(fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8"));
        await admin.query("INSERT INTO vehiculo(placa,capacidad_galones) VALUES ('TEST',100); INSERT INTO proveedor(nombre) VALUES ('Test'); INSERT INTO categoria_producto(nombre) VALUES ('Test'); INSERT INTO producto(id_categoria,nombre,unidad_medida) VALUES (1,'Filtro','unidad')");
        await admin.query("COMMIT");
        pool.connect = isolated.connect.bind(isolated);
        pool.query = isolated.query.bind(isolated);
        server = require("../src/app").listen(0, "127.0.0.1");
        await new Promise(resolve => server.once("listening", resolve));
        const base = `http://127.0.0.1:${server.address().port}/api`;
        const request = async (route, body) => {
            const response = await fetch(base + route, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {});
            return { status: response.status, body: await response.json() };
        };
        const motivo = { motivo: "Registro incorrecto" };
        const stock = async () => Number((await request("/inventario/stock/1")).body.stock_actual);
        const invoice = await request("/facturas-proveedor", {
            id_proveedor: 1, numero_factura: "ANULAR-1", fecha_emision: "2026-10-01",
            detalles: [{ tipo_concepto: "PRODUCTO", id_producto: 1, descripcion: "Filtro", cantidad: "5", precio_unitario: "1", porcentaje_impuesto: "0" }],
            recepcion_inicial: { fecha_recepcion: "2026-10-01", detalles: [{ numero_detalle: 1, cantidad_recibida: "5" }] }
        });
        assert.equal(invoice.status, 201);
        const receiptRoute = "/recepciones-compra/" + invoice.body.recepcion_inicial.id_recepcion_compra + "/anular";
        const maintenance = await request("/mantenimientos", { id_vehiculo: 1, fecha: "2026-10-02", tipo: "Filtros", monto: "1", detalles: [{ id_producto: 1, cantidad: "2" }] });
        assert.equal(maintenance.status, 201);
        assert.equal(await stock(), 3);
        assert.equal((await request(receiptRoute, motivo)).status, 409);
        const maintenanceRoute = "/mantenimientos/" + maintenance.body.id_mantenimiento + "/anular";
        model.createReversion = async (...args) => { await original(...args); throw new Error("Fallo simulado"); };
        assert.equal((await request(maintenanceRoute, motivo)).status, 500);
        model.createReversion = original;
        assert.equal(await stock(), 3);
        assert.equal((await request("/mantenimientos/" + maintenance.body.id_mantenimiento)).body.estado, "REGISTRADO");
        const cancelled = await request(maintenanceRoute, motivo);
        assert.equal(cancelled.status, 200);
        assert.equal(cancelled.body.estado, "ANULADO");
        assert.ok(cancelled.body.fecha_anulacion);
        assert.equal(cancelled.body.reversiones[0].tipo_movimiento, "ENTRADA");
        assert.equal(await stock(), 5);
        assert.equal((await request(maintenanceRoute, motivo)).status, 409);
        const concurrent = await Promise.all([request(receiptRoute, motivo), request(receiptRoute, motivo)]);
        assert.deepEqual(concurrent.map(r => r.status).sort(), [200, 409]);
        assert.equal(await stock(), 0);
        const pending = await request("/facturas-proveedor/" + invoice.body.id_factura_proveedor + "/pendientes-recepcion");
        assert.equal(pending.body[0].pendiente_recibir, "5.00");
        const received = await request("/recepciones-compra", { id_factura_proveedor: invoice.body.id_factura_proveedor, fecha_recepcion: "2026-10-07", detalles: [{ id_detalle_factura_proveedor: invoice.body.detalles[0].id_detalle_factura_proveedor, cantidad_recibida: "5" }] });
        assert.equal(received.status, 201);
        const adjustment = await request("/inventario/ajustes", { id_producto: 1, fecha: "2026-10-07", cantidad: "-2", motivo: "Conteo" });
        const reverseRoute = "/inventario/ajustes/" + adjustment.body.id_movimiento + "/revertir";
        assert.equal((await request(reverseRoute, { motivo: " " })).status, 400);
        const reversed = await Promise.all([request(reverseRoute, motivo), request(reverseRoute, motivo)]);
        assert.deepEqual(reversed.map(r => r.status).sort(), [200, 409]);
        assert.equal(await stock(), 5);
        const inverse = reversed.find(r => r.status === 200).body.reversiones[0];
        assert.equal(inverse.cantidad, "2.00");
        assert.equal((await request("/inventario/ajustes/" + inverse.id_movimiento + "/revertir", motivo)).status, 409);
        const positive = await request("/inventario/ajustes", { id_producto: 1, fecha: "2026-10-07", cantidad: "10", motivo: "Conteo" });
        await request("/inventario/ajustes", { id_producto: 1, fecha: "2026-10-07", cantidad: "-12", motivo: "Conteo" });
        assert.equal((await request("/inventario/ajustes/" + positive.body.id_movimiento + "/revertir", motivo)).status, 409);
        assert.equal(await stock(), 3);
        assert.equal((await request("/mantenimientos/999/anular", motivo)).status, 404);
        assert.equal((await isolated.query("SELECT COUNT(*)::int n FROM movimiento_inventario WHERE id_movimiento_revertido IS NOT NULL")).rows[0].n, 3);
    } finally {
        model.createReversion = original;
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
