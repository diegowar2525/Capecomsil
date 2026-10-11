const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { validateData } = require("../src/utils/validators/producto.validators");
const { translateDatabaseError } = require("../src/utils/errors");

const data = { id_categoria: 1, nombre: " Filtro ", unidad_medida: " UNIDAD " };

test("PRODUCTO: datos normalizados y límites", () => {
    const result = validateData(data);
    assert.equal(result.nombre, "Filtro");
    assert.equal(result.unidad_medida, "unidad");
    assert.equal(result.stock_minimo, "0");
    assert.equal(result.marca, null);
    assert.equal(result.estado, true);
    assert.equal(validateData({ ...data, condicion_llanta: " reencauchada " }).condicion_llanta, "REENCAUCHADA");
    for (const condicion_llanta of [true, "USADA", ""]) {
        assert.throws(() => validateData({ ...data, condicion_llanta }), { status: 400 });
    }
    assert.equal(validateData({ ...data, estado: false }).estado, false);
    for (const patch of [
        { id_categoria: true }, { nombre: " " }, { unidad_medida: " " },
        { nombre: "a".repeat(151) }, { medida: 12 }, { marca: [] },
        { stock_minimo: -1 }, { stock_minimo: true }, { stock_minimo: null },
        { stock_minimo: "0.001" }, { stock_minimo: "10000000000" }, { estado: "ACTIVO" }
    ]) {
        assert.throws(() => validateData({ ...data, ...patch }), { status: 400 });
    }
    assert.equal(translateDatabaseError({ code: "23514", constraint: "producto_unidad_historial" }).status, 409);
    assert.equal(translateDatabaseError({ code: "23514", constraint: "otra_restriccion" }), null);
});

test("PRODUCTO: API y protección real en PostgreSQL, con rollback", async () => {
    const pool = require("../src/config/database");
    const client = await pool.connect();
    const originalQuery = pool.query;
    let server;

    try {
        await client.query("BEGIN");
        await client.query("CREATE SCHEMA producto_test_" + process.pid);
        await client.query("SET LOCAL search_path TO producto_test_" + process.pid + ", public");
        await client.query(fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8"));
        await client.query("INSERT INTO categoria_producto(nombre,estado) VALUES ('Repuestos',true), ('Inactiva',false)");
        pool.query = client.query.bind(client);
        server = require("../src/app").listen(0, "127.0.0.1");
        await new Promise(resolve => server.once("listening", resolve));
        const base = `http://127.0.0.1:${server.address().port}/api/productos`;
        const request = async (method, suffix = "", payload = data) => {
            const response = await fetch(base + suffix, {
                method,
                headers: { "Content-Type": "application/json" },
                ...(["GET", "DELETE"].includes(method) ? {} : { body: JSON.stringify(payload) })
            });
            return { status: response.status, body: await response.json() };
        };
        const created = await request("POST");
        assert.equal(created.status, 201);
        const id = created.body.id_producto;
        assert.equal((await request("GET", `/${id}`)).body.nombre_categoria, "Repuestos");
        assert.equal((await request("GET")).body.length, 1);
        assert.equal((await request("GET", "/9999")).status, 404);
        assert.equal((await request("GET", "/abc")).status, 400);
        assert.equal((await request("POST", "", { ...data, id_categoria: 9999 })).status, 400);
        assert.equal((await request("POST", "", { ...data, id_categoria: 2 })).status, 409);
        assert.equal((await request("PUT", `/${id}`, { ...data, id_categoria: 2 })).status, 409);
        assert.equal((await request("PUT", `/${id}`, { ...data, unidad_medida: "pieza" })).status, 200);
        await client.query("UPDATE categoria_producto SET estado=false WHERE id_categoria=1");
        assert.equal((await request("PUT", `/${id}`, { ...data, unidad_medida: "pieza", estado: false })).status, 200);
        await client.query("UPDATE categoria_producto SET estado=true WHERE id_categoria=1");
        const duplicate = await request("POST");
        assert.equal(duplicate.status, 201);
        assert.equal((await request("DELETE", `/${duplicate.body.id_producto}`)).status, 200);
        assert.equal((await request("PUT", "/9999")).status, 404);
        assert.equal((await request("DELETE", "/9999")).status, 404);

        const rejected = async (sql, code, constraint) => {
            await client.query("SAVEPOINT invalid_case");
            await assert.rejects(client.query(sql), { code, constraint });
            await client.query("ROLLBACK TO SAVEPOINT invalid_case");
        };
        await rejected("INSERT INTO producto(id_categoria,nombre,unidad_medida) VALUES (2,'No','unidad')", "23514", "producto_categoria_activa");
        await client.query("INSERT INTO proveedor(nombre) VALUES ('Prueba'); INSERT INTO factura_proveedor(id_proveedor,numero_factura,fecha_emision,subtotal,total) VALUES (1,'TEST',CURRENT_DATE,1,1)");
        await client.query("INSERT INTO vehiculo(placa,capacidad_galones) VALUES ('TEST',100); INSERT INTO mantenimiento(id_vehiculo,tipo,monto) VALUES (1,'Prueba',1)");
        const histories = [
            ["movimiento_inventario", "INSERT INTO movimiento_inventario(id_producto,tipo_movimiento,cantidad,motivo) VALUES ($1,'ENTRADA',1,'Prueba')", "fk_movimiento_producto"],
            ["detalle_factura_proveedor", "INSERT INTO detalle_factura_proveedor(id_producto,id_factura_proveedor,tipo_concepto,descripcion,cantidad,precio_unitario,subtotal,porcentaje_impuesto,impuesto,total_linea) VALUES ($1,1,'PRODUCTO','Prueba',1,1,1,0,0,1)", "fk_detalle_factura_proveedor_producto"],
            ["detalle_mantenimiento", "INSERT INTO detalle_mantenimiento(id_producto,id_mantenimiento,cantidad) VALUES ($1,1,1)", "fk_detalle_mantenimiento_producto"]
        ];
        for (const [table, insert, constraint] of histories) {
            await client.query(insert, [id]);
            assert.equal((await request("DELETE", `/${id}`)).status, 409);
            assert.equal((await request("PUT", `/${id}`, data)).status, 409);
            assert.equal((await request("PUT", `/${id}`, { ...data, unidad_medida: "pieza", estado: false })).status, 200);
            await rejected(`UPDATE producto SET unidad_medida='litro' WHERE id_producto=${id}`, "23514", "producto_unidad_historial");
            await rejected(`DELETE FROM producto WHERE id_producto=${id}`, "23503", constraint);
            await client.query(`DELETE FROM ${table} WHERE id_producto=$1`, [id]);
        }
        assert.equal((await request("DELETE", `/${id}`)).status, 200);
        const categoriaUrl = base.replace("/productos", "/categorias-producto");
        const categoriaRequest = async (method, suffix, payload) => {
            const response = await fetch(categoriaUrl + suffix, {
                method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
            });
            return { status: response.status, body: await response.json() };
        };
        const categoria = await categoriaRequest("POST", "", { nombre: "Neumáticos", es_llanta: true });
        assert.equal(categoria.status, 201);
        assert.equal(categoria.body.es_llanta, true);
        const categoriaId = categoria.body.id_categoria;
        const llanta = { ...data, id_categoria: categoriaId, medida: "11R22.5", condicion_llanta: "NUEVA" };
        const creada = await request("POST", "", llanta);
        assert.equal(creada.status, 201);
        assert.equal(creada.body.condicion_llanta, "NUEVA");
        const llantaId = creada.body.id_producto;
        assert.equal((await request("PUT", `/${llantaId}`, { ...llanta, condicion_llanta: "REENCAUCHADA" })).body.condicion_llanta, "REENCAUCHADA");
        assert.equal((await request("GET", `/${llantaId}`)).body.condicion_llanta, "REENCAUCHADA");
        assert.equal((await categoriaRequest("PUT", `/${categoriaId}`, { nombre: "Llantas", es_llanta: true })).status, 200);
        const rejectedRequest = async (fn) => {
            await client.query("SAVEPOINT invalid_http");
            const result = await fn();
            await client.query("ROLLBACK TO SAVEPOINT invalid_http");
            assert.equal(result.status, 409);
            assert.notEqual(result.body.message, "Error interno del servidor");
        };
        await rejectedRequest(() => request("POST", "", { ...llanta, condicion_llanta: null }));
        await rejectedRequest(() => request("POST", "", { ...llanta, id_categoria: 1 }));
        await rejectedRequest(() => categoriaRequest("PUT", `/${categoriaId}`, { nombre: "Llantas", es_llanta: false }));
        await client.query("INSERT INTO movimiento_inventario(id_producto,tipo_movimiento,cantidad,motivo) VALUES ($1,'ENTRADA',1,'Prueba')", [llantaId]);
        await rejectedRequest(() => request("PUT", `/${llantaId}`, llanta));
        await rejectedRequest(() => request("PUT", `/${llantaId}`, { ...llanta, condicion_llanta: "REENCAUCHADA", medida: "315/80 R22.5" }));
        assert.equal((await request("PUT", `/${llantaId}`, { ...llanta, condicion_llanta: "REENCAUCHADA", estado: false })).status, 200);
    } finally {
        if (server) await new Promise(resolve => server.close(resolve));
        pool.query = originalQuery;
        await client.query("ROLLBACK");
        client.release();
        await pool.end();
    }
});
