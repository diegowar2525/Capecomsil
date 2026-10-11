const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
const { validateData, validateFiltros } = require("../src/utils/validators/viaje.validators");
const body = { fecha_inicio: "2026-10-08", fecha_fin: "2026-10-09", id_vehiculo: 1, id_chofer: 1, tramos: [
    { orden: 1, id_gasolinera_origen: 1, id_terminal_destino: 1, kilometros: "10.25" },
    { orden: 2, id_terminal_origen: 1, id_gasolinera_destino: 1, kilometros: "10.25" },
    { orden: 3, id_gasolinera_origen: 1, id_gasolinera_destino: 2, kilometros: "5.10" }
], detalles: [
    { id_gasolinera: 1, id_terminal: 1, id_producto_transportado: 1, galones: "60.00" },
    { id_gasolinera: 2, id_terminal: 1, id_producto_transportado: 1, galones: "40.00" }
] };

test("Viajes: validación de entregas", () => {
    for (const patch of [
        { fecha_fin: "2026-10-07" }, { fecha_inicio: "2026-10-08T24:00:00" },
        { tramos: [] }, { tramos: [null] },
        { tramos: body.tramos.map(t => ({ ...t, orden: 1 })) },
        { tramos: body.tramos.map(t => ({ ...t, kilometros: "0" })) },
        { tramos: body.tramos.slice(0, 2) },
        { tramos: body.tramos.map(t => ({ ...t, id_terminal_origen: 1 })) }
    ]) assert.throws(() => validateData({ ...body, ...patch }), { status: 400 });
    assert.equal(validateData({ ...body, fecha_inicio: "2026-10-08T09:30" }).fecha_inicio, "2026-10-08T09:30:00");
    for (const patch of [{ detalles: [] }, { detalles: [null] }, { fecha_inicio: "2026-02-30" },
        { detalles: [body.detalles[0], body.detalles[0]] }, { id_chofer: true },
        ...["0", "-1", "0.001"].map(galones => ({ detalles: [{ ...body.detalles[0], galones }] }))]) {
        assert.throws(() => validateData({ ...body, ...patch }), { status: 400 });
    }
    assert.equal(validateData(body).detalles.length, 2);
    for (const q of [{ estado: "OTRO" }, { limit: "201" }, { offset: [] }, { id_vehiculo: true },
        { fecha_desde: "2026-10-09", fecha_hasta: "2026-10-08" }]) {
        assert.throws(() => validateFiltros(q), { status: 400 });
    }
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
        assert.equal(first.body.kilometros_recorridos, "25.60");
        assert.equal(first.body.tramos.length, 3);
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
        assert.equal((await post({ ...body, fecha_inicio: "2026-10-09" })).status, 409);
        const missingPlace = body.tramos.map(t => t.orden === 1 ? { ...t, id_gasolinera_origen: 999 } : t);
        assert.equal((await post({ ...body, tramos: missingPlace })).status, 400);
        const count = async () => (await isolated.query("SELECT COUNT(*)::int n FROM viaje")).rows[0].n;
        const before = await count();
        let calls = 0;
        model.create = async (...args) => { const value = await original(...args); if (++calls === 2) throw new Error("Fallo después de segundo detalle"); return value; };
        assert.equal((await post(body)).status, 500);
        model.create = original;
        assert.equal(await count(), before);
        assert.equal((await isolated.query("SELECT count(*)::int n FROM tramo_viaje")).rows[0].n, 6);
        assert.equal((await isolated.query("SELECT COUNT(*)::int n FROM detalle_viaje")).rows[0].n, 4);
        await assert.rejects(isolated.query("UPDATE tarifa SET valor_por_galon=1 WHERE id_tarifa=1"), { code: "23514" });
        assert.equal((await isolated.query("SELECT COUNT(*)::int n FROM movimiento_inventario")).rows[0].n, 0);
        const request = async (route, payload) => {
            const r = await fetch(`http://127.0.0.1:${server.address().port}/api/viajes${route}`, payload
                ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) } : {});
            return { status: r.status, body: await r.json() };
        };
        const id = first.body.id_viaje;
        const fetched = await request("/" + id);
        assert.equal(fetched.status, 200);
        assert.equal(fetched.body.tramos[2].nombre_destino, "B");
        assert.equal(fetched.body.kilometros_recorridos, "25.60");
        assert.equal(fetched.body.placa, "TEST");
        assert.equal(fetched.body.detalles[1].nombre_gasolinera, "B");
        assert.equal(fetched.body.detalles[0].nombre_producto_transportado, "Diesel");
        assert.equal(fetched.body.valor_transporte, "3.70");
        const filtered = await request("?id_gasolinera=2&id_terminal=1&id_vehiculo=1&id_chofer=1");
        assert.equal(filtered.body.length, 1);
        assert.equal(filtered.body[0].total_galones, "100.00");
        assert.equal((await request("?id_terminal=999")).body.length, 0);
        assert.equal((await request("?limit=1&offset=1")).body[0].id_viaje, id);
        await isolated.query("UPDATE viaje SET fecha_inicio='2026-10-08 23:59:59' WHERE id_viaje=$1", [id]);
        assert.equal((await request("?fecha_desde=2026-10-08&fecha_hasta=2026-10-08")).body.length, 2);
        assert.equal((await request("?fecha_desde=2026-10-09")).body.length, 0);
        assert.equal((await request("/99999")).status, 404);
        assert.equal((await request("/abc")).status, 400);
        assert.equal((await request("?estado=OTRO")).status, 400);
        const motivo = { motivo: "Registro incorrecto" };
        assert.equal((await request(`/${id}/anular`, { motivo: " " })).status, 400);
        assert.equal((await request("/99999/anular", motivo)).status, 404);
        await isolated.query("INSERT INTO liquidacion(id_gasolinera,periodo_inicio,periodo_fin) VALUES (2,'2026-10-01','2026-10-31')");
        await isolated.query("UPDATE detalle_viaje SET id_liquidacion=1 WHERE id_detalle_viaje=$1", [first.body.detalles[1].id_detalle_viaje]);
        assert.equal((await request(`/${id}/anular`, motivo)).status, 409);
        assert.equal((await request('/' + id)).body.estado, "REGISTRADO");
        await isolated.query("UPDATE detalle_viaje SET id_liquidacion=NULL WHERE id_viaje=$1", [id]);
        const viajeModel = require("../src/models/viaje.model");
        const anularOriginal = viajeModel.anular;
        try {
            viajeModel.anular = async (...args) => { await anularOriginal(...args); throw new Error("Fallo de anulación simulado"); };
            assert.equal((await request(`/${id}/anular`, motivo)).status, 500);
        } finally {
            viajeModel.anular = anularOriginal;
        }
        assert.equal((await request('/' + id)).body.fecha_anulacion, null);
        const canceladas = await Promise.all([request(`/${id}/anular`, motivo), request(`/${id}/anular`, motivo)]);
        assert.deepEqual(canceladas.map(r => r.status).sort(), [200,409]);
        const cancelled = canceladas.find(r => r.status === 200).body;
        assert.equal(cancelled.detalles.length, 2);
        assert.equal(cancelled.tramos.length, 3);
        assert.equal(cancelled.valor_transporte, "3.70");
        assert.equal(cancelled.motivo_anulacion, motivo.motivo);
        assert.ok(cancelled.fecha_anulacion);
        assert.equal((await request("?estado=ANULADO")).body.length, 1);
        assert.equal((await request("?estado=REGISTRADO")).body.length, 1);
        await assert.rejects(isolated.query("DELETE FROM tarifa WHERE id_tarifa=1"), { code: "23503" });
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
