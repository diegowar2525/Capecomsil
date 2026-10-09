const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

test("Anulación de compras: dependencias, historial, rollback y concurrencia", async () => {
    const pool = require("../src/config/database");
    const connect = pool.connect;
    const query = pool.query;
    const admin = await pool.connect();
    const schema = "anular_factura_test_" + process.pid;
    const isolated = new Pool({ ...pool.options, password: pool.options.password, options: "-c search_path=" + schema + ",public" });
    const model = require("../src/models/factura_proveedor.model");
    const original = model.anular;
    let server;
    try {
        await admin.query("BEGIN");
        await admin.query("CREATE SCHEMA " + schema);
        await admin.query("SET LOCAL search_path TO " + schema + ",public");
        await admin.query(fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8"));
        await admin.query("INSERT INTO proveedor(nombre) VALUES ('Test'); INSERT INTO categoria_producto(nombre) VALUES ('Test'); INSERT INTO producto(id_categoria,nombre,unidad_medida) VALUES (1,'Filtro','unidad')");
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
        let numero = 0;
        const create = async () => {
            const response = await request("/facturas-proveedor", {
                id_proveedor: 1, numero_factura: "ANULACION-" + ++numero, fecha_emision: "2026-10-01",
                detalles: [{ tipo_concepto: "PRODUCTO", id_producto: 1, descripcion: "Filtro", cantidad: "5", precio_unitario: "10", porcentaje_impuesto: "0" }]
            });
            assert.equal(response.status, 201);
            return response.body;
        };
        const motivo = { motivo: "Factura registrada por error" };
        const cancel = (f, body = motivo) => request("/facturas-proveedor/" + f.id_factura_proveedor + "/anular", body);
        const pay = f => request("/pagos-proveedor", { id_factura_proveedor: f.id_factura_proveedor, fecha_pago: "2026-10-08", monto: "10", forma_pago: "EFECTIVO" });
        const receive = f => request("/recepciones-compra", { id_factura_proveedor: f.id_factura_proveedor, fecha_recepcion: "2026-10-08", detalles: [{ id_detalle_factura_proveedor: f.detalles[0].id_detalle_factura_proveedor, cantidad_recibida: "2" }] });
        const invoice = await create();
        assert.equal((await cancel(invoice, { motivo: " " })).status, 400);
        assert.equal((await cancel({ id_factura_proveedor: 999 })).status, 404);
        assert.equal((await cancel({ id_factura_proveedor: "abc" })).status, 400);
        const payment = await pay(invoice);
        const receipt = await receive(invoice);
        assert.equal(payment.status, 201);
        assert.equal(receipt.status, 201);
        const blocked = await cancel(invoice);
        assert.equal(blocked.status, 409);
        assert.match(JSON.stringify(blocked.body), /pagos y recepciones/);
        await request("/pagos-proveedor/" + payment.body.id_pago_proveedor + "/anular", motivo);
        assert.equal((await cancel(invoice)).status, 409);
        await request("/recepciones-compra/" + receipt.body.id_recepcion_compra + "/anular", motivo);
        model.anular = async (...args) => { await original(...args); throw new Error("Fallo después de anular factura"); };
        assert.equal((await cancel(invoice)).status, 500);
        model.anular = original;
        const intact = (await request("/facturas-proveedor/" + invoice.id_factura_proveedor)).body;
        assert.equal(intact.estado, "REGISTRADA");
        assert.equal(intact.fecha_anulacion, null);
        const before = (await isolated.query("SELECT COUNT(*)::int n FROM movimiento_inventario")).rows[0].n;
        const simultaneous = await Promise.all([cancel(invoice), cancel(invoice)]);
        assert.deepEqual(simultaneous.map(r => r.status).sort(), [200, 409]);
        const result = simultaneous.find(r => r.status === 200).body;
        assert.equal(result.estado, "ANULADA");
        assert.equal(result.total, "50.00");
        assert.equal(result.detalles.length, 1);
        assert.equal(result.motivo_anulacion, motivo.motivo);
        assert.ok(result.fecha_anulacion);
        assert.equal((await isolated.query("SELECT COUNT(*)::int n FROM movimiento_inventario")).rows[0].n, before);
        assert.equal((await pay(invoice)).status, 409);
        assert.equal((await receive(invoice)).status, 409);
        assert.deepEqual((await request("/proveedores/1/cuentas-por-pagar")).body, []);
        // Una carrera con un alta debe dejar solo una de las dos operaciones confirmada.
        for (const operation of [pay, receive]) {
            const fresh = await create();
            const race = await Promise.all([cancel(fresh), operation(fresh)]);
            assert.ok((race[0].status === 200 && race[1].status === 409)
                || (race[0].status === 409 && race[1].status === 201));
        }
        const empty = await create();
        assert.equal((await cancel(empty)).status, 200);
    } finally {
        model.anular = original;
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
