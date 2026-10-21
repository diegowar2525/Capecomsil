const { createAuthenticatedFetch } = require("./helpers/authenticated-fetch");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

test("Costos y horarios: CRUD, histórico, transacciones, concurrencia y anulaciones", async () => {
    const pool = require("../src/config/database");
    const connect = pool.connect, query = pool.query;
    const admin = await pool.connect();
    const schema = "costos_horarios_" + process.pid;
    const isolated = new Pool({ ...pool.options, password: pool.options.password, options: "-c search_path=" + schema + ",public" });
    let server;
    try {
        await admin.query("BEGIN");
        await admin.query("CREATE SCHEMA " + schema);
        await admin.query("SET LOCAL search_path TO " + schema + ",public");
        await admin.query(fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8"));
        await admin.query(`INSERT INTO configuracion_remuneracion(importe_diario,adicional_dia_especial,fecha_inicio) VALUES (35,35,'2026-01-01');
            INSERT INTO vehiculo(placa,capacidad_galones) VALUES ('V1',100),('V2',100);
            INSERT INTO chofer(nombre,cedula,tipo_remuneracion) VALUES ('C1','C1','DIARIO_FIJO'),('C2','C2','DIA_TRABAJADO');
            INSERT INTO terminal(nombre) VALUES ('T'); INSERT INTO gasolinera(nombre) VALUES ('G');
            INSERT INTO producto_transportado(nombre,unidad_medida) VALUES ('Diesel','galones');
            INSERT INTO tarifa(id_gasolinera,id_terminal,valor_por_galon,fecha_inicio) VALUES (1,1,0.04,'2026-01-01');
            INSERT INTO trayecto(nombre,id_terminal_origen,id_gasolinera_destino,kilometros) VALUES ('T-G',1,1,100);
            INSERT INTO trayecto(nombre,id_gasolinera_origen,id_terminal_destino,kilometros) VALUES ('G-T',1,1,100);`);
        await admin.query("COMMIT");
        pool.connect = isolated.connect.bind(isolated);
        pool.query = isolated.query.bind(isolated);
        const authenticatedFetch = await createAuthenticatedFetch(pool);
        server = require("../src/app").listen(0, "127.0.0.1");
        await new Promise(resolve => server.once("listening", resolve));
        const req = async (route, method = "GET", body) => {
            const response = await authenticatedFetch(`http://127.0.0.1:${server.address().port}/api${route}`, {
                method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body)
            });
            return { status: response.status, body: await response.json() };
        };
        const vigente = { fecha_inicio: "2026-01-01", fecha_fin: null };
        const combustible = { ...vigente, consumo_galones_km: "0.10", precio_por_galon: "3" };
        const viatico = { ...vigente, importe_diario: "12.01" };
        const rutas = ["/configuraciones-combustible", "/configuraciones-viatico", "/configuraciones-peaje-trayecto"];
        for (const [route, body] of [[rutas[0], combustible], [rutas[1], viatico], [rutas[2], { ...vigente, id_trayecto: 1, importe: "2.50" }]]) {
            assert.equal((await req(route, "POST", body)).status, 201);
            assert.equal((await req(route, "POST", body)).status, 409);
            assert.equal((await req(route + "/1")).status, 200);
            assert.equal((await req(route)).body.length, 1);
            assert.equal((await req(route + "/999", "PUT", body)).status, 404);
        }
        assert.equal((await req(rutas[2], "POST", { ...vigente, id_trayecto: 2, importe: 0 })).status, 201);
        assert.equal((await req(rutas[2], "POST", { ...vigente, id_trayecto: 999, importe: 0 })).status, 400);
        assert.equal((await req(rutas[0], "POST", { ...combustible, consumo_galones_km: 0 })).status, 400);
        assert.equal((await req(rutas[1], "POST", { ...viatico, fecha_fin: "2025-01-01" })).status, 400);
        // IDs con saltos tras intentos rechazados: las identidades no son consecutivas garantizadas.
        const peajeId = (await req(rutas[2])).body.find(r => r.id_trayecto === 1).id_configuracion_peaje_trayecto;
        const bodyViaje = (inicio, fin, extra = {}) => ({ id_vehiculo: 1, id_chofer: 1,
            fecha_inicio: `2026-10-16T${inicio}:00`, fecha_fin: `2026-10-16T${fin}:00`,
            tramos: [{ orden: 1, id_trayecto: 1 }, { orden: 2, id_trayecto: 2 }],
            detalles: [{ id_terminal: 1, id_gasolinera: 1, id_producto_transportado: 1, galones: "50" }], ...extra });
        const postViaje = (inicio, fin, extra) => req("/viajes", "POST", bodyViaje(inicio, fin, extra));
        // Configuración ausente: ninguna parte del viaje ni remuneración debe quedar guardada.
        await isolated.query("UPDATE configuracion_viatico SET fecha_inicio='2027-01-01'");
        assert.equal((await postViaje("08:00", "09:00")).status, 409);
        assert.equal((await isolated.query("SELECT count(*)::int n FROM viaje")).rows[0].n, 0);
        assert.equal((await isolated.query("SELECT count(*)::int n FROM costo_viaje")).rows[0].n, 0);
        await isolated.query("UPDATE configuracion_viatico SET fecha_inicio='2026-01-01'");
        const first = await postViaje("08:00", "09:00");
        assert.equal(first.status, 201, JSON.stringify(first));
        const costos = Object.fromEntries(first.body.costos.map(c => [c.tipo_costo, c]));
        assert.equal(costos.COMBUSTIBLE.valor, "60.00");
        assert.equal(costos.COMBUSTIBLE.galones_estimados, "20.000000");
        assert.equal(costos.PEAJE.valor, "2.50");
        assert.equal(costos.VIATICO.valor, "12.01");
        assert.equal((await postViaje("08:30", "09:30", { id_chofer: 2 })).status, 409);
        assert.equal((await postViaje("08:30", "09:30", { id_vehiculo: 2 })).status, 409);
        const siguientes = await Promise.all([postViaje("09:00", "10:00"), postViaje("10:00", "11:00")]);
        assert.ok(siguientes.every(r => r.status === 201), JSON.stringify(siguientes));
        assert.deepEqual((await isolated.query("SELECT valor FROM costo_viaje WHERE tipo_costo='VIATICO' ORDER BY id_viaje")).rows.map(r => r.valor), ["4.01", "4.00", "4.00"]);
        for (const [route, body] of [[rutas[0], { ...combustible, precio_por_galon: 4 }], [rutas[1], { ...viatico, importe_diario: 15 }], [rutas[2], { ...vigente, id_trayecto: 1, importe: 6 }]]) {
            const id = route === rutas[2] ? peajeId : 1;
            assert.equal((await req(route + "/" + id, "PUT", body)).status, 409);
            assert.equal((await req(route + "/" + id, "DELETE")).status, 409);
        }
        assert.equal((await req(rutas[0] + "/1", "PUT", { ...combustible, fecha_fin: "2026-10-15" })).status, 409);
        assert.equal((await req(rutas[0] + "/1", "PUT", { ...combustible, fecha_fin: "2026-10-16" })).status, 200);
        const futura = await req(rutas[0], "POST", { ...combustible, precio_por_galon: 4, fecha_inicio: "2026-10-17" });
        assert.equal(futura.status, 201);
        assert.equal((await req(rutas[0] + "/" + futura.body.id_configuracion_combustible, "DELETE")).status, 200);
        assert.equal((await req(`/viajes/${first.body.id_viaje}`)).body.costos.find(c => c.tipo_costo === "COMBUSTIBLE").valor, "60.00");
        const mantenimiento = (inicio, fin) => req("/mantenimientos", "POST", { id_vehiculo: 1,
            fecha_inicio: `2026-10-16T${inicio}:00`, fecha_fin: fin ? `2026-10-16T${fin}:00` : null,
            tipo: "Prueba", monto: 0, detalles: [] });
        assert.equal((await mantenimiento("08:30", "09:30")).status, 409);
        const abierto = await mantenimiento("11:00", null);
        assert.equal(abierto.status, 201);
        assert.equal((await postViaje("13:00", "14:00")).status, 409);
        const finalizar = body => req(`/mantenimientos/${abierto.body.id_mantenimiento}/finalizar`, "POST", body);
        assert.equal((await finalizar({ fecha_fin: "2026-10-16T10:00:00" })).status, 400);
        assert.equal((await finalizar({ fecha_fin: "2026-10-16T13:00:00" })).status, 200);
        assert.equal((await finalizar({ fecha_fin: "2026-10-16T14:00:00" })).status, 409);
        const simultaneos = await Promise.all([postViaje("13:00", "14:00"), mantenimiento("13:00", "14:00")]);
        assert.deepEqual(simultaneos.map(r => r.status).sort(), [201,409]);
        const activos = (await isolated.query("SELECT id_viaje FROM viaje WHERE estado='REGISTRADO'")).rows;
        for (const v of activos) assert.equal((await req(`/viajes/${v.id_viaje}/anular`, "POST", { motivo: "Prueba" })).status, 200);
        assert.equal((await isolated.query("SELECT total FROM viatico_chofer")).rows[0].total, "0.00");
        assert.equal((await isolated.query("SELECT count(*)::int n FROM costo_viaje WHERE tipo_costo='VIATICO'")).rows[0].n, 0);
        assert.ok((await isolated.query("SELECT count(*)::int n FROM costo_viaje WHERE tipo_costo='COMBUSTIBLE'")).rows[0].n > 0);
        assert.equal((await req(rutas[1] + "/1", "DELETE")).status, 409);
        // Dos solicitudes por el mismo horario: solo una puede confirmarse.
        const competencia = await Promise.all([postViaje("08:00", "09:00"), postViaje("08:00", "09:00")]);
        assert.deepEqual(competencia.map(r => r.status).sort(), [201,409]);
    } finally {
        if (server) await new Promise(resolve => server.close(resolve));
        pool.connect = connect; pool.query = query;
        await isolated.end();
        await admin.query("ROLLBACK");
        await admin.query("DROP SCHEMA IF EXISTS " + schema + " CASCADE");
        admin.release();
        await pool.end();
    }
});
