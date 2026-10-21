const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
const pool = require("../src/config/database");
const { createAuthenticatedFetch } = require("./helpers/authenticated-fetch");
const { validateEdicion } = require("../src/utils/validators/viaje.validators");
const historialModel = require("../src/models/viaje_historial.model");

const baseData = {
    fecha_inicio: "2026-10-08T08:00:00", fecha_fin: "2026-10-08T09:00:00", id_vehiculo: 1, id_chofer: 1,
    tramos: [{ orden: 1, id_trayecto: 1 }, { orden: 2, id_trayecto: 2 }],
    detalles: [{ id_gasolinera: 1, id_terminal: 1, id_producto_transportado: 1, galones: "60" },
        { id_gasolinera: 2, id_terminal: 1, id_producto_transportado: 1, galones: "40" }]
};
const payload = (viaje) => ({
    fecha_inicio: viaje.fecha_inicio, fecha_fin: viaje.fecha_fin, id_vehiculo: viaje.id_vehiculo, id_chofer: viaje.id_chofer,
    version: viaje.version, motivo: "Corrección verificada",
    detalles: viaje.detalles.map(({ id_detalle_viaje, id_gasolinera, id_terminal, id_producto_transportado, galones }) =>
        ({ id_detalle_viaje, id_gasolinera, id_terminal, id_producto_transportado, galones })),
    tramos: viaje.tramos.map(({ id_tramo_viaje, orden, id_trayecto, observacion }) =>
        ({ id_tramo_viaje, orden, id_trayecto, observacion }))
});

test("Edición: versión, motivo, IDs y campos controlados por el servidor", () => {
    const data = { ...baseData, version: 1, motivo: "Corrección" };
    assert.equal(validateEdicion(data).detalles[0].id_detalle_viaje, null);
    for (const patch of [{ version: undefined }, { version: true }, { motivo: " " }, { estado: "ANULADO" },
        { detalles: baseData.detalles.map((d) => ({ ...d, id_detalle_viaje: 1 })) },
        { detalles: [{ ...baseData.detalles[0], tarifa_aplicada: "99" }] },
        { tramos: [{ orden: 1, id_trayecto: 1, kilometros: 100 }] }]) {
        assert.throws(() => validateEdicion({ ...data, ...patch }), { status: 400 });
    }
    const normalized = validateEdicion({ ...data, tramos: [
        { orden: 2, id_trayecto: 2, id_tramo_viaje: 12 }, { orden: 1, id_trayecto: 1, id_tramo_viaje: 11 }
    ] });
    assert.deepEqual(normalized.tramos.map((tramo) => tramo.id_tramo_viaje), [11, 12]);
});

test("Edición HTTP: historial, tarifas entre fechas, recálculos, liquidaciones y concurrencia", async (t) => {
    const admin = await pool.connect();
    const originalQuery = pool.query;
    const originalConnect = pool.connect;
    const schemaName = "viajes_edicion_" + process.pid;
    const isolated = new Pool({ ...pool.options, password: pool.options.password, options: "-c search_path=" + schemaName + ",public" });
    let server;
    try {
        await admin.query("BEGIN");
        await admin.query(`CREATE SCHEMA ${schemaName}`);
        await admin.query(`SET LOCAL search_path TO ${schemaName},public`);
        const schema = fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8");
        await admin.query(schema.split("-- Edición de viajes y auditoría (etapa 5).")[0]);
        await admin.query(`INSERT INTO configuracion_remuneracion(importe_diario,adicional_dia_especial,fecha_inicio) VALUES (35,35,'2026-01-01');
            INSERT INTO vehiculo(placa,capacidad_galones) VALUES ('EDIT1',100),('EDIT2',100);
            INSERT INTO chofer(nombre,cedula,tipo_remuneracion) VALUES ('Uno','EDIT1','DIA_TRABAJADO'),('Dos','EDIT2','DIA_TRABAJADO');
            INSERT INTO gasolinera(nombre) VALUES ('A'),('B'); INSERT INTO terminal(nombre) VALUES ('T');
            INSERT INTO producto_transportado(nombre,unidad_medida) VALUES ('Diesel','galones');
            INSERT INTO tarifa(id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
            VALUES (1,1,0.10,'2026-01-01','2026-10-08'),(1,1,0.20,'2026-10-09',NULL),(2,1,0.30,'2026-01-01',NULL);
            INSERT INTO trayecto(nombre,id_terminal_origen,id_gasolinera_destino,kilometros) VALUES ('T-A',1,1,10);
            INSERT INTO trayecto(nombre,id_gasolinera_origen,id_gasolinera_destino,kilometros) VALUES ('A-B',1,2,20);
            INSERT INTO trayecto(nombre,id_gasolinera_origen,id_terminal_destino,kilometros) VALUES ('B-T',2,1,30);
            INSERT INTO configuracion_peaje_trayecto(id_trayecto,importe,fecha_inicio) SELECT id_trayecto,1,'2026-01-01' FROM trayecto;
            INSERT INTO configuracion_combustible(consumo_galones_km,precio_por_galon,fecha_inicio) VALUES (0.1,3,'2026-01-01');
            INSERT INTO configuracion_viatico(importe_diario,fecha_inicio) VALUES (12,'2026-01-01');`);
        // La migración también admite viajes preexistentes.
        await admin.query(`INSERT INTO viaje(id_vehiculo,id_chofer,fecha_inicio,fecha_fin,estado,fecha_anulacion,motivo_anulacion)
            VALUES (1,1,'2026-01-01 08:00','2026-01-01 09:00','ANULADO',CURRENT_TIMESTAMP,'Previo')`);
        await admin.query(`INSERT INTO tramo_viaje(id_viaje,orden,id_trayecto,kilometros,id_configuracion_peaje_trayecto,peaje_aplicado)
            VALUES (1,1,1,10,1,1)`);
        const migration = fs.readFileSync(path.join(__dirname, "../../database/migrations/018_edicion_viajes.sql"), "utf8");
        await admin.query("SET CONSTRAINTS ALL IMMEDIATE");
        await admin.query(migration.replace(/^BEGIN;\s*/, "").replace(/COMMIT;\s*$/, ""));
        assert.equal((await admin.query("SELECT version FROM viaje")).rows[0].version, 1);
        await admin.query("COMMIT");
        pool.query = isolated.query.bind(isolated);
        pool.connect = isolated.connect.bind(isolated);
        const jefe = await createAuthenticatedFetch(isolated);
        const operador = await createAuthenticatedFetch(isolated, "OPERADOR");
        server = require("../src/app").listen(0, "127.0.0.1");
        await new Promise((resolve) => server.once("listening", resolve));
        const base = `http://127.0.0.1:${server.address().port}/api`;
        const request = async (route, method = "GET", data, client = operador) => {
            const res = await client(base + route, { method, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
            return { status: res.status, body: await res.json() };
        };
        const creado = await request("/viajes", "POST", baseData);
        assert.equal(creado.status, 201);
        const id = creado.body.id_viaje;
        const route = "/viajes/" + id;
        const get = async () => (await request(route)).body;
        const segundo = await request("/viajes", "POST", { ...baseData, fecha_inicio: "2026-10-08T10:00:00", fecha_fin: "2026-10-08T11:00:00" });
        assert.equal(segundo.status, 201);
        let actual = await get();
        const editar = (data) => request(route, "PUT", data);
        assert.equal((await request(route, "PUT", payload(actual), fetch)).status, 401);
        await isolated.query(`DELETE FROM rol_permiso WHERE id_rol=(SELECT id_rol FROM rol WHERE codigo='OPERADOR')
            AND id_permiso=(SELECT id_permiso FROM permiso WHERE codigo='viajes.editar')`);
        assert.equal((await editar(payload(actual))).status, 403);
        await isolated.query(`INSERT INTO rol_permiso SELECT id_rol,id_permiso FROM rol CROSS JOIN permiso
            WHERE rol.codigo='OPERADOR' AND permiso.codigo='viajes.editar'`);
        for (const [patch, status] of [
            [{ detalles: [{ ...payload(actual).detalles[0], galones: "101" }] }, 400],
            [{ id_chofer: 99999 }, 400],
            [{ detalles: [{ ...payload(actual).detalles[0], id_detalle_viaje: segundo.body.detalles[0].id_detalle_viaje }] }, 400],
            [{ tramos: [{ ...payload(actual).tramos[0], id_tramo_viaje: segundo.body.tramos[0].id_tramo_viaje }] }, 400],
            [{ tramos: [payload(actual).tramos[0]] }, 400],
            [{ fecha_inicio: "2026-10-08T10:30:00", fecha_fin: "2026-10-08T11:30:00" }, 409]
        ]) {
            assert.equal((await editar({ ...payload(actual), ...patch })).status, status);
            assert.deepEqual(await get(), actual);
        }
        // Kilómetros del catálogo cambian para nuevos tramos, no para los conservados.
        await isolated.query("UPDATE trayecto SET kilometros=99 WHERE id_trayecto=1");
        const cambios = payload(actual);
        cambios.detalles[0].galones = "50";
        cambios.tramos.push({ orden: 3, id_trayecto: 3 });
        const editado = await editar(cambios);
        assert.equal(editado.status, 200, JSON.stringify(editado.body));
        actual = editado.body;
        assert.equal(actual.version, 2);
        assert.equal(actual.detalles[0].id_detalle_viaje, creado.body.detalles[0].id_detalle_viaje);
        assert.equal(actual.tramos[0].kilometros, "10.00");
        assert.equal(actual.kilometros_recorridos, "60.00");
        assert.equal(actual.valor_transporte, "17.00");
        assert.equal(actual.costos.find((c) => c.tipo_costo === "COMBUSTIBLE").valor, "18.00");
        assert.deepEqual(await get(), actual);
        const historial = (await request(route + "/historial")).body;
        assert.equal(historial[0].id_actor, operador.idUsuario);
        assert.equal(historial[0].anterior.version, 1);
        assert.equal(historial[0].posterior.version, 2);
        // Cambiar fecha atraviesa la vigencia y conserva el ID de la entrega.
        const movido = await editar({ ...payload(actual), id_chofer: 2, id_vehiculo: 2,
            fecha_inicio: "2026-10-09T08:00:00", fecha_fin: "2026-10-09T09:00:00" });
        assert.equal(movido.status, 200, JSON.stringify(movido.body));
        actual = movido.body;
        assert.equal(actual.detalles[0].tarifa_aplicada, "0.2000");
        assert.equal(actual.detalles[0].id_detalle_viaje, creado.body.detalles[0].id_detalle_viaje);
        assert.equal(actual.costos.find((c) => c.tipo_costo === "CHOFER").valor, "35.00");
        const remanente = (await request("/viajes/" + segundo.body.id_viaje)).body;
        assert.equal(remanente.costos.find((c) => c.tipo_costo === "CHOFER").valor, "35.00");
        assert.equal(remanente.costos.find((c) => c.tipo_costo === "VIATICO").valor, "12.00");
        const otroDia = await editar({ ...payload(actual), fecha_inicio: "2026-10-10T08:00:00", fecha_fin: "2026-10-10T09:00:00" });
        assert.equal(otroDia.status, 200);
        actual = otroDia.body;
        assert.equal((await isolated.query("SELECT total FROM remuneracion_chofer WHERE id_chofer=2 AND fecha='2026-10-09'")).rows[0].total, "0.00");
        assert.equal((await isolated.query("SELECT total FROM viatico_chofer WHERE id_chofer=2 AND fecha='2026-10-09'")).rows[0].total, "0.00");
        // Fallo posterior a los recálculos debe revertir toda la operación.
        const antesRemuneraciones = (await isolated.query("SELECT * FROM remuneracion_chofer ORDER BY id_remuneracion_chofer")).rows;
        const mock = t.mock.method(historialModel, "create", async () => { throw new Error("Fallo de auditoría simulado"); });
        assert.equal((await editar({ ...payload(actual), fecha_inicio: "2026-10-11T08:00:00", fecha_fin: "2026-10-11T09:00:00" })).status, 500);
        mock.mock.restore();
        assert.deepEqual(await get(), actual);
        assert.deepEqual((await isolated.query("SELECT * FROM remuneracion_chofer ORDER BY id_remuneracion_chofer")).rows, antesRemuneraciones);
        // Una liquidación en borrador también reserva la entrega.
        const liquidacion = (await isolated.query("INSERT INTO liquidacion(id_gasolinera,periodo_inicio,periodo_fin) VALUES (1,'2026-10-01','2026-10-31') RETURNING id_liquidacion")).rows[0].id_liquidacion;
        await isolated.query("INSERT INTO detalle_liquidacion(id_liquidacion,id_detalle_viaje) VALUES ($1,$2)", [liquidacion, actual.detalles[0].id_detalle_viaje]);
        assert.equal((await editar(payload(actual))).status, 409);
        await isolated.query("UPDATE liquidacion SET estado='ANULADA',fecha_anulacion=CURRENT_TIMESTAMP,motivo_anulacion='Corrección' WHERE id_liquidacion=$1", [liquidacion]);
        const copiaLiquidacion = (await isolated.query("SELECT * FROM detalle_liquidacion WHERE id_liquidacion=$1", [liquidacion])).rows;
        assert.equal((await editar({ ...payload(actual), detalles: [payload(actual).detalles[1]] })).status, 409);
        const correccion = payload(actual);
        correccion.detalles[0].galones = "45";
        correccion.detalles.pop();
        correccion.tramos = [correccion.tramos[0]];
        const corregido = await editar(correccion);
        assert.equal(corregido.status, 200, JSON.stringify(corregido.body));
        actual = corregido.body;
        assert.equal(actual.tramos.length, 1);
        assert.equal(actual.detalles.length, 1);
        assert.deepEqual((await isolated.query("SELECT * FROM detalle_liquidacion WHERE id_liquidacion=$1", [liquidacion])).rows, copiaLiquidacion);
        const nuevaEntrega = payload(actual);
        nuevaEntrega.detalles.push({ ...baseData.detalles[1], galones: "10" });
        nuevaEntrega.tramos.push({ orden: 2, id_trayecto: 2 });
        actual = (await editar(nuevaEntrega)).body;
        assert.equal(actual.detalles.length, 2);
        const resultados = await Promise.all([editar(payload(actual)), editar(payload(actual))]);
        assert.deepEqual(resultados.map((res) => res.status).sort(), [200, 409]);
        actual = await get();
        assert.equal((await request("/gastos", "POST", { id_viaje: id, fecha: "2026-10-10", tipo_gasto: "OTRO", monto: "5" }, jefe)).status, 201);
        assert.equal((await editar({ ...payload(actual), id_vehiculo: 1 })).status, 409);
        const cancelados = await Promise.all([editar(payload(actual)), request(route + "/anular", "POST", { motivo: "Descartado" })]);
        assert.equal(cancelados[1].status, 200);
        assert.ok([200,409].includes(cancelados[0].status));
        assert.equal((await editar(payload(await get()))).status, 409);
        assert.equal((await request("/viajes/2147483647", "PUT", payload(actual))).status, 404);
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
