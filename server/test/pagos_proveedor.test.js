const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
const { validateData, validateFiltros } = require("../src/utils/validators/pago_proveedor.validators");
const data = { id_factura_proveedor: 1, fecha_pago: "2026-10-08", monto: "20.10", forma_pago: "EFECTIVO" };

test("Pagos: validación de importes, referencias, formas y filtros", () => {
    assert.equal(validateData({ ...data, forma_pago: " efectivo " }).forma_pago, "EFECTIVO");
    for (const patch of [{ monto: 0 }, { monto: true }, { monto: "-1" }, { monto: "0.001" },
        { monto: "1000000000000" }, { fecha_pago: "2026-02-30" }, { id_factura_proveedor: true },
        { forma_pago: "CHEQUE" }, { forma_pago: "TRANSFERENCIA" }, { forma_pago: "" },
        { numero_cheque: "123" }, { observacion: {} }]) {
        assert.throws(() => validateData({ ...data, ...patch }), { status: 400 });
    }
    for (const q of [{ estado: "PAGADA" }, { limit: "201" }, { offset: [] },
        { fecha_desde: "2026-10-09", fecha_hasta: "2026-10-08" }]) {
        assert.throws(() => validateFiltros(q), { status: 400 });
    }
});

test("Pagos: abonos, saldo exacto, anulaciones, filtros, rollback y concurrencia", async () => {
    const pool = require("../src/config/database");
    const connect = pool.connect;
    const query = pool.query;
    const admin = await pool.connect();
    const schema = "pagos_test_" + process.pid;
    const isolated = new Pool({ ...pool.options, password: pool.options.password, options: "-c search_path=" + schema + ",public" });
    const model = require("../src/models/pago_proveedor.model");
    const originalCreate = model.create;
    const originalAnular = model.anular;
    let server;
    try {
        await admin.query("BEGIN");
        await admin.query("CREATE SCHEMA " + schema);
        await admin.query("SET LOCAL search_path TO " + schema + ",public");
        await admin.query(fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8"));
        await admin.query("INSERT INTO proveedor(nombre) VALUES ('Test'),('Sin deuda')");
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
        const invoice = await request("/facturas-proveedor", {
            id_proveedor: 1, numero_factura: "PAGO-1", fecha_emision: "2026-10-01", fecha_vencimiento: "2026-10-02",
            detalles: [{ tipo_concepto: "SERVICIO", descripcion: "Reparación", cantidad: "1", precio_unitario: "100.30", porcentaje_impuesto: "0" }]
        });
        assert.equal(invoice.status, 201);
        assert.equal(invoice.body.estado, "REGISTRADA");
        assert.equal(invoice.body.estado_pago, "PENDIENTE");
        // Fecha relativa para que la prueba siga siendo válida en otro día.
        await isolated.query("UPDATE factura_proveedor SET fecha_vencimiento=CURRENT_DATE-1");
        const id = invoice.body.id_factura_proveedor;
        const post = patch => request("/pagos-proveedor", { ...data, id_factura_proveedor: id, ...patch });
        const factura = async () => (await request("/facturas-proveedor/" + id)).body;
        const first = await post({});
        assert.equal(first.status, 201);
        assert.equal(first.body.saldo_pendiente, "80.20");
        assert.equal((await factura()).estado_pago, "PARCIAL");
        assert.equal((await factura()).vencida, true);
        assert.equal((await post({ monto: "80.21" })).status, 409);
        assert.equal((await post({ id_factura_proveedor: 999 })).status, 404);
        model.create = async (...args) => { await originalCreate(...args); throw new Error("Fallo de prueba después de pago"); };
        assert.equal((await post({})).status, 500);
        model.create = originalCreate;
        assert.equal((await factura()).total_pagado, "20.10");
        const concurrent = await Promise.all([post({ monto: "80.20", forma_pago: "TRANSFERENCIA", numero_comprobante: "ABC" }), post({ monto: "80.20" })]);
        assert.deepEqual(concurrent.map(r => r.status).sort(), [201, 409]);
        assert.equal((await factura()).saldo_pendiente, "0.00");
        assert.equal((await factura()).estado_pago, "PAGADA");
        assert.equal((await factura()).vencida, false);
        assert.equal((await post({ monto: "0.01" })).status, 409);
        assert.deepEqual((await request("/proveedores/1/cuentas-por-pagar")).body, []);
        assert.equal((await request("/facturas-proveedor/" + id + "/pagos")).body.length, 2);
        assert.equal((await request("/pagos-proveedor?estado=REGISTRADO&id_proveedor=1&fecha_desde=2026-10-08&fecha_hasta=2026-10-08&limit=1&offset=1")).body.length, 1);
        const cancelRoute = "/pagos-proveedor/" + first.body.id_pago_proveedor + "/anular";
        assert.equal((await request(cancelRoute, { motivo: " " })).status, 400);
        model.anular = async (...args) => { await originalAnular(...args); throw new Error("Fallo de prueba después de anular"); };
        assert.equal((await request(cancelRoute, { motivo: "Error" })).status, 500);
        model.anular = originalAnular;
        assert.equal((await factura()).saldo_pendiente, "0.00");
        const cancelled = await Promise.all([request(cancelRoute, { motivo: "Error" }), request(cancelRoute, { motivo: "Error" })]);
        assert.deepEqual(cancelled.map(r => r.status).sort(), [200, 409]);
        assert.equal((await factura()).saldo_pendiente, "20.10");
        assert.equal((await factura()).estado_pago, "PARCIAL");
        const history = await request("/pagos-proveedor/" + first.body.id_pago_proveedor);
        assert.equal(history.body.monto, "20.10");
        assert.equal(history.body.estado, "ANULADO");
        assert.ok(history.body.fecha_anulacion);
        assert.equal(history.body.motivo_anulacion, "Error");
        assert.equal((await request("/proveedores/1/cuentas-por-pagar")).body.length, 1);
        assert.equal((await request("/proveedores/999/cuentas-por-pagar")).status, 404);
        assert.deepEqual((await request("/proveedores/2/cuentas-por-pagar")).body, []);
        assert.equal((await request("/pagos-proveedor?estado=ANULADO")).body.length, 1);
        assert.equal((await request("/pagos-proveedor/999")).status, 404);
        assert.equal((await request("/facturas-proveedor/999/pagos")).status, 404);
        // El comprobante compartido no es una clave única.
        await isolated.query("UPDATE pago_proveedor SET numero_comprobante='ABC'");
        assert.equal((await post({ forma_pago: "TRANSFERENCIA", numero_comprobante: "ABC" })).status, 201);
        await isolated.query("UPDATE factura_proveedor SET estado='ANULADA'");
        assert.equal((await post({})).status, 409);
        assert.deepEqual((await request("/proveedores/1/cuentas-por-pagar")).body, []);
        assert.equal((await isolated.query("SELECT COUNT(*)::int n FROM movimiento_inventario")).rows[0].n, 0);
    } finally {
        model.create = originalCreate;
        model.anular = originalAnular;
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
