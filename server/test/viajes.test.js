const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
const { validateData } = require("../src/utils/validators/viaje.validators");
const body = { fecha: "2026-10-08", id_vehiculo: 1, id_chofer: 1, detalles: [
    { id_gasolinera: 1, id_terminal: 1, id_producto_transportado: 1, galones: "60.00" },
    { id_gasolinera: 2, id_terminal: 1, id_producto_transportado: 1, galones: "40.00" }
] };

test("Viajes: validación de entregas", () => {
    for (const patch of [{ detalles: [] }, { detalles: [null] }, { fecha: "2026-02-30" },
        { detalles: [body.detalles[0], body.detalles[0]] }, { id_chofer: true },
        ...["0", "-1", "0.001"].map(galones => ({ detalles: [{ ...body.detalles[0], galones }] }))]) {
        assert.throws(() => validateData({ ...body, ...patch }), { status: 400 });
    }
    assert.equal(validateData(body).detalles.length, 2);
});

test("Viajes: registro HTTP, tarifas históricas, capacidad y rollback", async () => {
    const pool = require("../src/config/database");
    const connect = pool.connect;
    const query = pool.query;
    const admin = await pool.connect();
    const schema = "viajes_test_" + process.pid;
    const isolated = new Pool({ ...pool.options, password: pool.options.password, options: "-c search_path=" + schema + ",public" });
    const model = require("../src/models/detalle_viaje.model");
    const original = model.create;
    let server;
    try {
        await admin.query("BEGIN");
        await admin.query("CREATE SCHEMA " + schema);
        await admin.query("SET LOCAL search_path TO " + schema + ",public");
        await admin.query(fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8"));
        await admin.query(`INSERT INTO vehiculo(placa,capacidad_galones) VALUES ('TEST',100);
            INSERT INTO chofer(nombre,cedula,tipo_remuneracion) VALUES ('Test','TEST','SUELDO');
            INSERT INTO gasolinera(nombre) VALUES ('A'),('B'); INSERT INTO terminal(nombre) VALUES ('T');
            INSERT INTO producto_transportado(nombre,unidad_medida) VALUES ('Diesel','galones'),('Extra','galones');
            INSERT INTO tarifa(id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin,estado)
            VALUES (1,1,0.035,'2026-01-01','2026-10-08',false),(2,1,0.04,'2026-01-01',NULL,true);`);
        await admin.query("COMMIT");
        pool.connect = isolated.connect.bind(isolated);
        pool.query = isolated.query.bind(isolated);
        server = require("../src/app").listen(0, "127.0.0.1");
        await new Promise(resolve => server.once("listening", resolve));
        const post = async data => {
            const r = await fetch(`http://127.0.0.1:${server.address().port}/api/viajes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
            return { status: r.status, body: await r.json() };
        };
        const first = await post({ ...body, estado: "ANULADO", detalles: body.detalles.map(d => ({ ...d, tarifa_aplicada: "99", valor_transporte: "999", id_liquidacion: 123 })) });
        assert.equal(first.status, 201);
        assert.equal(first.body.estado, "REGISTRADO");
        assert.equal(first.body.total_galones, "100.00");
        assert.equal(first.body.valor_transporte, "3.70");
        assert.equal(first.body.detalles[0].tarifa_aplicada, "0.0350");
        assert.ok(first.body.detalles.every(d => d.id_liquidacion === null));
        assert.equal((await post({ ...body, detalles: [{ ...body.detalles[0], galones: "100.01" }] })).status, 400);
        const partial = await post({ ...body, detalles: [{ ...body.detalles[0], galones: "10" }, { ...body.detalles[0], id_producto_transportado: 2, galones: "10" }] });
        assert.equal(partial.status, 201);
        assert.equal(partial.body.total_galones, "20.00");
        assert.equal(partial.body.advertencias, undefined);
        for (const patch of [{ id_vehiculo: 999 }, { id_chofer: 999 }, { detalles: [{ ...body.detalles[0], id_producto_transportado: 999 }] }]) {
            assert.equal((await post({ ...body, ...patch })).status, 400);
        }
        assert.equal((await post({ ...body, fecha: "2026-10-09" })).status, 409);
        const count = async () => (await isolated.query("SELECT COUNT(*)::int n FROM viaje")).rows[0].n;
        const before = await count();
        let calls = 0;
        model.create = async (...args) => { const value = await original(...args); if (++calls === 2) throw new Error("Fallo después de segundo detalle"); return value; };
        assert.equal((await post(body)).status, 500);
        model.create = original;
        assert.equal(await count(), before);
        assert.equal((await isolated.query("SELECT COUNT(*)::int n FROM detalle_viaje")).rows[0].n, 4);
        await assert.rejects(isolated.query("UPDATE tarifa SET valor_por_galon=1 WHERE id_tarifa=1"), { code: "23514" });
        assert.equal((await isolated.query("SELECT COUNT(*)::int n FROM movimiento_inventario")).rows[0].n, 0);
    } finally {
        model.create = original;
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
