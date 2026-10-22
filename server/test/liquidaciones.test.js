const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
const pool = require("../src/config/database");
const { createAuthenticatedFetch } = require("./helpers/authenticated-fetch");
const validators = require("../src/utils/validators/liquidacion.validators");
const detalleModel = require("../src/models/detalle_liquidacion.model");
const liquidacionModel = require("../src/models/liquidacion.model");

const periodo = { id_gasolinera: 1, periodo_inicio: "2026-10-08", periodo_fin: "2026-10-09" };

test("Liquidaciones: validadores de período, selección, versión y campos no editables", () => {
    assert.equal(validators.validateCreacion(periodo).id_detalles_viaje, null);
    assert.deepEqual(validators.validateEdicion({ ...periodo, version: 1, id_detalles_viaje: [] }).id_detalles_viaje, []);
    for (const data of [null, [], {}, { ...periodo, periodo_fin: "2026-02-30" }, { ...periodo, periodo_fin: "2026-10-07" },
        { ...periodo, id_detalles_viaje: [] }, { ...periodo, id_detalles_viaje: [1, "1"] }, { ...periodo, id_detalles_viaje: [true] },
        ...["estado", "retencion", "recargo", "total_liquidacion", "id_usuario"].map((key) => ({ ...periodo, [key]: 0 }))]) {
        assert.throws(() => validators.validateCreacion(data), { status: 400 });
    }
    assert.throws(() => validators.validateEdicion({ ...periodo, id_detalles_viaje: [1] }), { status: 400 });
    assert.throws(() => validators.validateEdicion({ ...periodo, version: 1 }), { status: 400 });
    for (const query of [{ estado: "OTRO" }, { limit: 201 }, { offset: -1 }, { offset: [] }, { id_gasolinera: true },
        { periodo_desde: "2026-11-01", periodo_hasta: "2026-10-01" }, { desconocido: "x" }]) {
        assert.throws(() => validators.validateFiltros(query), { status: 400 });
    }
});

test("Liquidaciones HTTP: jefe, disponibilidad, borradores, reservas, rollback y concurrencia", async (t) => {
    const admin = await pool.connect();
    const originalQuery = pool.query;
    const originalConnect = pool.connect;
    const schemaName = "liquidaciones_test_" + process.pid;
    const isolated = new Pool({ ...pool.options, password: pool.options.password, options: "-c search_path=" + schemaName + ",public" });
    let server;
    try {
        await admin.query("BEGIN");
        await admin.query(`CREATE SCHEMA ${schemaName}`);
        await admin.query(`SET LOCAL search_path TO ${schemaName},public`);
        const schema = fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8");
        await admin.query(schema.split("-- Liquidaciones: consultas y borradores (permisos exclusivos del jefe).")[0]);
        await admin.query(`INSERT INTO configuracion_remuneracion(importe_diario,adicional_dia_especial,fecha_inicio) VALUES (35,35,'2026-01-01');
            INSERT INTO vehiculo(placa,capacidad_galones) VALUES ('LIQ',100);
            INSERT INTO chofer(nombre,cedula,tipo_remuneracion) VALUES ('Prueba','LIQ','DIA_TRABAJADO');
            INSERT INTO gasolinera(nombre) VALUES ('A'),('B'),('Sin entregas'); INSERT INTO terminal(nombre) VALUES ('T');
            INSERT INTO producto_transportado(nombre,unidad_medida) VALUES ('Diesel','galones');
            INSERT INTO tarifa(id_gasolinera,id_terminal,valor_por_galon,fecha_inicio) VALUES (1,1,0.035,'2026-01-01'),(2,1,0.04,'2026-01-01');
            INSERT INTO trayecto(nombre,id_terminal_origen,id_gasolinera_destino,kilometros) VALUES ('T-A',1,1,10);
            INSERT INTO trayecto(nombre,id_gasolinera_origen,id_gasolinera_destino,kilometros) VALUES ('A-B',1,2,20);
            INSERT INTO configuracion_peaje_trayecto(id_trayecto,importe,fecha_inicio) SELECT id_trayecto,0,'2026-01-01' FROM trayecto;
            INSERT INTO configuracion_combustible(consumo_galones_km,precio_por_galon,fecha_inicio) VALUES (0.1,3,'2026-01-01');
            INSERT INTO configuracion_viatico(importe_diario,fecha_inicio) VALUES (12,'2026-01-01');
            INSERT INTO liquidacion(id_gasolinera,periodo_inicio,periodo_fin,observacion) VALUES (3,'2026-01-01','2026-01-02','Anterior');`);
        const migration = fs.readFileSync(path.join(__dirname, "../../database/migrations/020_liquidaciones_borradores.sql"), "utf8");
        await admin.query(migration.replace(/^BEGIN;\s*/, "").replace(/COMMIT;\s*$/, ""));
        assert.equal((await admin.query("SELECT version FROM liquidacion")).rows[0].version, 1);
        await admin.query("COMMIT");
        pool.query = isolated.query.bind(isolated);
        pool.connect = isolated.connect.bind(isolated);
        const jefe = await createAuthenticatedFetch(isolated);
        const operador = await createAuthenticatedFetch(isolated, "OPERADOR");
        server = require("../src/app").listen(0, "127.0.0.1");
        await new Promise((resolve) => server.once("listening", resolve));
        const base = `http://127.0.0.1:${server.address().port}/api`;
        const request = async (route, method = "GET", data, client = jefe) => {
            const res = await client(base + route, { method, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
            return { status: res.status, body: await res.json() };
        };
        const preview = (params = periodo) => request("/liquidaciones/entregas-disponibles?" + new URLSearchParams(params));
        const create = (data = periodo) => request("/liquidaciones", "POST", data);
        for (const [route, method, data] of [["/liquidaciones", "GET"], ["/liquidaciones/1", "GET"],
            ["/liquidaciones/entregas-disponibles", "GET"], ["/liquidaciones", "POST", periodo], ["/liquidaciones/1", "PUT", {}]]) {
            assert.equal((await request(route, method, data, operador)).status, 403);
            assert.equal((await request(route, method, data, fetch)).status, 401);
        }
        // Incluso una asignación errónea directa no concede al operador permisos exclusivos del jefe.
        await isolated.query(`INSERT INTO rol_permiso SELECT id_rol,id_permiso FROM rol CROSS JOIN permiso
            WHERE rol.codigo='OPERADOR' AND permiso.modulo='liquidaciones'`);
        assert.equal((await request("/liquidaciones", "GET", undefined, operador)).status, 403);
        const badCsrf = await fetch(base + "/liquidaciones", { method: "POST", headers: { Cookie: jefe.cookie, "Content-Type": "application/json" }, body: JSON.stringify(periodo) });
        assert.equal(badCsrf.status, 403);
        const viaje = async (fecha, hora, detalles) => {
            const res = await request("/viajes", "POST", { id_vehiculo: 1, id_chofer: 1,
                fecha_inicio: `${fecha}T${hora}:00:00`, fecha_fin: `${fecha}T${hora}:30:00`,
                tramos: [{ orden: 1, id_trayecto: 1 }, { orden: 2, id_trayecto: 2 }],
                detalles: detalles ?? [{ id_gasolinera: 1, id_terminal: 1, id_producto_transportado: 1, galones: "10" }] });
            assert.equal(res.status, 201, JSON.stringify(res.body));
            return res.body;
        };
        const primero = await viaje("2026-10-08", "08", [
            { id_gasolinera: 1, id_terminal: 1, id_producto_transportado: 1, galones: "60.01" },
            { id_gasolinera: 2, id_terminal: 1, id_producto_transportado: 1, galones: "39.99" }
        ]);
        const segundo = await viaje("2026-10-09", "23");
        const anulado = await viaje("2026-10-09", "10");
        await request(`/viajes/${anulado.id_viaje}/anular`, "POST", { motivo: "Descartado" });
        const fuera = await viaje("2026-10-10", "08");
        const idA = primero.detalles[0].id_detalle_viaje;
        const idB = segundo.detalles[0].id_detalle_viaje;
        const idOtra = primero.detalles[1].id_detalle_viaje;
        const disponibles = await preview();
        assert.equal(disponibles.status, 200, JSON.stringify(disponibles.body));
        assert.equal(disponibles.body.cantidad, 2);
        assert.equal(disponibles.body.total_galones, "70.01");
        assert.equal(disponibles.body.valor_transporte, "2.45");
        assert.deepEqual(disponibles.body.entregas.map((d) => d.id_detalle_viaje), [idA, idB]);
        assert.equal((await preview({ ...periodo, id_gasolinera: 3 })).body.cantidad, 0);
        assert.equal((await preview({ ...periodo, id_gasolinera: 9999 })).status, 404);
        assert.equal((await create({ ...periodo, id_gasolinera: 3 })).status, 409);
        for (const idEntrega of [idOtra, fuera.detalles[0].id_detalle_viaje, anulado.detalles[0].id_detalle_viaje, 9999]) {
            assert.equal((await create({ ...periodo, id_detalles_viaje: [idEntrega] })).status, 409);
        }
        const creada = await create();
        assert.equal(creada.status, 201, JSON.stringify(creada.body));
        let actual = creada.body;
        const id = actual.id_liquidacion;
        const route = "/liquidaciones/" + id;
        const get = async () => (await request(route)).body;
        const update = (ids, extras = {}) => request(route, "PUT", { ...periodo, id_detalles_viaje: ids, version: actual.version, ...extras });
        assert.equal(actual.estado, "BORRADOR");
        assert.equal(actual.total_liquidacion, "2.45");
        assert.equal(actual.retencion, "0.00");
        assert.equal(actual.recargo, "0.00");
        assert.equal(actual.detalles[0].tarifa_aplicada, "0.0350");
        assert.deepEqual(await get(), actual);
        assert.equal((await preview()).body.cantidad, 0);
        assert.ok((await preview({ ...periodo, id_liquidacion: id })).body.entregas.every((d) => d.seleccionada));
        assert.equal((await create()).status, 409);
        assert.equal((await request(`/viajes/${primero.id_viaje}/anular`, "POST", { motivo: "Reservado" })).status, 409);
        // Mantener una entrega conserva su detalle de liquidación y libera la otra.
        const editada = await update([idA], { observacion: "Selección corregida" });
        assert.equal(editada.status, 200, JSON.stringify(editada.body));
        actual = editada.body;
        assert.equal(actual.total_liquidacion, "2.10");
        assert.equal(actual.detalles[0].id_detalle_liquidacion, creada.body.detalles[0].id_detalle_liquidacion);
        assert.equal((await preview()).body.entregas[0].id_detalle_viaje, idB);
        assert.equal((await update([idA], { version: 1 })).status, 409);
        const seleccionExplicita = await create({ ...periodo, id_detalles_viaje: [idB] });
        assert.equal(seleccionExplicita.status, 201);
        assert.equal((await update([idA, idB])).status, 409);
        assert.deepEqual(await get(), actual);
        // Libera la selección sin borrar la cabecera del borrador.
        actual = (await update([])).body;
        assert.equal(actual.total_galones, "0.00");
        assert.equal(actual.detalles.length, 0);
        const count = async () => (await isolated.query("SELECT count(*)::int n FROM liquidacion")).rows[0].n;
        const antes = await count();
        const falloDetalle = t.mock.method(detalleModel, "create", async () => { throw new Error("Fallo simulado en detalle"); });
        assert.equal((await create({ ...periodo, id_detalles_viaje: [idA] })).status, 500);
        falloDetalle.mock.restore();
        assert.equal(await count(), antes);
        assert.equal((await preview()).body.cantidad, 1);
        actual = (await update([idA])).body;
        // Cambio de gasolinera: elimina las entregas anteriores antes de cambiar la cabecera.
        const falloTotales = t.mock.method(liquidacionModel, "recalcularTotales", async () => { throw new Error("Fallo simulado en totales"); });
        assert.equal((await update([idOtra], { id_gasolinera: 2 })).status, 500);
        falloTotales.mock.restore();
        assert.deepEqual(await get(), actual);
        const cambiado = await update([idOtra], { id_gasolinera: 2 });
        assert.equal(cambiado.status, 200, JSON.stringify(cambiado.body));
        actual = cambiado.body;
        assert.equal(actual.total_liquidacion, "1.60");
        assert.equal((await preview()).body.cantidad, 1);
        // Dos creaciones por la misma entrega: solo una puede reservarla.
        const concurrentes = await Promise.all([create({ ...periodo, id_detalles_viaje: [idA] }), create({ ...periodo, id_detalles_viaje: [idA] })]);
        assert.deepEqual(concurrentes.map((r) => r.status).sort(), [201, 409]);
        const editadas = await Promise.all([update([idOtra], { id_gasolinera: 2 }), update([idOtra], { id_gasolinera: 2 })]);
        assert.deepEqual(editadas.map((r) => r.status).sort(), [200, 409]);
        actual = await get();
        assert.equal((await request("/liquidaciones?estado=BORRADOR&id_gasolinera=2&periodo_desde=2026-10-09&periodo_hasta=2026-10-09&limit=1&offset=0")).body[0].id_liquidacion, id);
        assert.equal((await request("/liquidaciones?periodo_desde=2027-01-01")).body.length, 0);
        // Se prueban estados por SQL; todavía no se exponen acciones HTTP de transición.
        await isolated.query("UPDATE liquidacion SET estado='ENVIADA',fecha_envio=CURRENT_TIMESTAMP WHERE id_liquidacion=$1", [id]);
        assert.equal((await update([idOtra], { id_gasolinera: 2 })).status, 409);
        assert.equal((await preview({ ...periodo, id_gasolinera: 2, id_liquidacion: id })).status, 409);
        await isolated.query("UPDATE liquidacion SET estado='CONFIRMADA',fecha_confirmacion=CURRENT_TIMESTAMP WHERE id_liquidacion=$1", [id]);
        assert.equal((await update([idOtra], { id_gasolinera: 2 })).status, 409);
        const copia = (await request(route)).body.detalles;
        await isolated.query("UPDATE liquidacion SET estado='ANULADA',fecha_anulacion=CURRENT_TIMESTAMP,motivo_anulacion='Prueba' WHERE id_liquidacion=$1", [id]);
        assert.equal((await update([idOtra], { id_gasolinera: 2 })).status, 409);
        assert.equal((await preview({ ...periodo, id_gasolinera: 2 })).body.cantidad, 1);
        const reemplazoManual = await create({ ...periodo, id_gasolinera: 2 });
        assert.equal(reemplazoManual.status, 201);
        assert.deepEqual((await request(route)).body.detalles, copia);
        // Liquidar y anular el mismo viaje comparten el candado: nunca pueden ganar ambos.
        const carreraViaje = await Promise.all([
            create({ ...periodo, periodo_inicio: "2026-10-10", periodo_fin: "2026-10-10",
                id_detalles_viaje: [fuera.detalles[0].id_detalle_viaje] }),
            request(`/viajes/${fuera.id_viaje}/anular`, "POST", { motivo: "Prueba concurrente" })
        ]);
        assert.ok((carreraViaje[0].status === 201 && carreraViaje[1].status === 409)
            || (carreraViaje[0].status === 409 && carreraViaje[1].status === 200));
        for (const [suffix, method] of [["", "DELETE"], ["/enviar", "POST"], ["/confirmar", "POST"], ["/anular", "POST"]]) {
            const res = await jefe(base + route + suffix, { method, body: JSON.stringify({ motivo: "No implementado" }) });
            assert.equal(res.status, 404);
        }
        assert.equal((await request("/liquidaciones/999999")).status, 404);
        assert.equal((await request("/liquidaciones/abc")).status, 400);
        assert.equal((await request("/liquidaciones/999999", "PUT", { ...periodo, version: 1, id_detalles_viaje: [] })).status, 404);
    } finally {
        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
        pool.query = originalQuery;
        pool.connect = originalConnect;
        await isolated.end();
        await admin.query("ROLLBACK");
        await admin.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
        admin.release();
        await pool.end();
    }
});
