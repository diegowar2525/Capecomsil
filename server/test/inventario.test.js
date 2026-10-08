const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
const { validateAjuste, validateFiltros } = require("../src/utils/validators/inventario.validators");

const ajuste = { id_producto: 1, fecha: "2026-10-07", cantidad: "3", motivo: "Conteo físico" };

test("Inventario: validación de ajustes y filtros", () => {
    assert.equal(validateAjuste({ ...ajuste, cantidad: "-0.01" }).cantidad, "-0.01");
    for (const patch of [{ cantidad: 0 }, { cantidad: "-0.00" }, { cantidad: "1.001" }, { motivo: " " }, { fecha: "2026-02-30" }]) {
        assert.throws(() => validateAjuste({ ...ajuste, ...patch }), { status: 400 });
    }
    for (const query of [{ tipo_movimiento: "OTRO" }, { fecha_desde: "2026-10-08", fecha_hasta: "2026-10-07" }, { limit: "201" }, { offset: "-1" }]) {
        assert.throws(() => validateFiltros(query), { status: 400 });
    }
});

test("Inventario: consultas, ajustes atómicos y concurrencia", async () => {
    const pool = require("../src/config/database");
    const connect = pool.connect;
    const query = pool.query;
    const admin = await pool.connect();
    const schema = "inventario_test_" + process.pid;
    const isolated = new Pool({ ...pool.options, password: pool.options.password, options: "-c search_path=" + schema + ",public" });
    const model = require("../src/models/movimiento_inventario.model");
    const original = model.getDisponibilidad;
    let server;
    try {
        await admin.query("BEGIN");
        await admin.query("CREATE SCHEMA " + schema);
        await admin.query("SET LOCAL search_path TO " + schema + ",public");
        await admin.query(fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8"));
        await admin.query("INSERT INTO proveedor(nombre) VALUES ('Prueba'); INSERT INTO categoria_producto(nombre) VALUES ('Prueba'); INSERT INTO producto(id_categoria,nombre,unidad_medida,stock_minimo) VALUES (1,'Filtro','unidad',2),(1,'Sin movimientos','unidad',1)");
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
        const post = body => request("/inventario/ajustes", body);
        assert.equal((await post(ajuste)).status, 201);
        const concurrent = await Promise.all([post({ ...ajuste, cantidad: "-2" }), post({ ...ajuste, cantidad: "-2" })]);
        assert.deepEqual(concurrent.map(r => r.status).sort(), [201, 409]);
        assert.equal((await request("/inventario/stock/1")).body.stock_actual, "1.00");
        assert.equal((await request("/inventario/stock/2")).body.stock_actual, "0");
        assert.equal((await request("/inventario/bajo-stock")).body.length, 2);
        assert.equal((await request("/inventario/stock")).body.length, 2);
        assert.equal((await post({ ...ajuste, id_producto: 999 })).status, 404);
        assert.equal((await post({ ...ajuste, cantidad: 0 })).status, 400);
        model.getDisponibilidad = async () => { throw new Error("Fallo simulado antes del commit"); };
        assert.equal((await post(ajuste)).status, 500);
        model.getDisponibilidad = original;
        assert.equal((await request("/inventario/stock/1")).body.stock_actual, "1.00");
        await isolated.query("UPDATE movimiento_inventario SET fecha='2026-10-07 23:59:59'");
        const history = await request("/inventario/movimientos?id_producto=1&fecha_desde=2026-10-07&fecha_hasta=2026-10-07&tipo_movimiento=AJUSTE&limit=1&offset=1");
        assert.equal(history.status, 200);
        assert.equal(history.body.length, 1);
        assert.equal((await request("/inventario/movimientos?tipo_movimiento=SALIDA")).body.length, 0);
        const invoice = await request("/facturas-proveedor", {
            id_proveedor: 1, numero_factura: "INV-TEST", fecha_emision: "2026-10-01",
            detalles: [
                { tipo_concepto: "PRODUCTO", id_producto: 1, descripcion: "Filtros", cantidad: "10", precio_unitario: "1", porcentaje_impuesto: "0" },
                { tipo_concepto: "SERVICIO", descripcion: "Servicio", cantidad: "1", precio_unitario: "1", porcentaje_impuesto: "0" }
            ],
            recepcion_inicial: { fecha_recepcion: "2026-10-01", detalles: [{ numero_detalle: 1, cantidad_recibida: "4" }] }
        });
        assert.equal(invoice.status, 201);
        const route = "/facturas-proveedor/" + invoice.body.id_factura_proveedor;
        const pending = await request(route + "/pendientes-recepcion");
        assert.equal(pending.body.length, 1);
        assert.equal(pending.body[0].pendiente_recibir, "6.00");
        const receipts = await request(route + "/recepciones");
        assert.equal(receipts.body[0].detalles[0].cantidad_recibida, "4.00");
        assert.equal((await request("/inventario/stock/1")).body.stock_actual, "5.00");
        assert.equal((await request("/inventario/bajo-stock")).body.length, 1);
        assert.equal((await request("/facturas-proveedor/999/recepciones")).status, 404);
        assert.equal((await request("/inventario/stock/999")).status, 404);
    } finally {
        model.getDisponibilidad = original;
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
