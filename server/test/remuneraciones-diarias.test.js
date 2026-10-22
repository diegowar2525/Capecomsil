const { createAuthenticatedFetch } = require("./helpers/authenticated-fetch");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

test("Remuneración diaria: calendario, centavos, concurrencia e importes históricos sin cierre propio", async () => {
    const pool = require("../src/config/database");
    const connect = pool.connect;
    const query = pool.query;
    const admin = await pool.connect();
    const schema = "diarias_test_" + process.pid;
    const isolated = new Pool({ ...pool.options, password: pool.options.password, options: "-c search_path=" + schema + ",public" });
    let server;
    try {
        await admin.query("BEGIN");
        await admin.query("CREATE SCHEMA " + schema);
        await admin.query("SET LOCAL search_path TO " + schema + ",public");
        await admin.query(fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8"));
        await admin.query(`INSERT INTO configuracion_remuneracion(importe_diario,adicional_dia_especial,fecha_inicio)
            VALUES (35,35,'2026-01-01');
            INSERT INTO chofer(nombre,cedula,tipo_remuneracion) VALUES ('Fijo','FIX','DIARIO_FIJO'),('Trabajado','DAY','DIA_TRABAJADO');
            INSERT INTO vehiculo(placa,capacidad_galones) VALUES ('TEST',100);
            INSERT INTO terminal(nombre) VALUES ('Terminal'); INSERT INTO gasolinera(nombre) VALUES ('Gasolinera');
            INSERT INTO producto_transportado(nombre,unidad_medida) VALUES ('Diesel','galón');
            INSERT INTO tarifa(id_gasolinera,id_terminal,valor_por_galon,fecha_inicio) VALUES (1,1,0.035,'2026-01-01');
            INSERT INTO trayecto(nombre,id_terminal_origen,id_gasolinera_destino,kilometros) VALUES ('Prueba',1,1,10);`);
        await admin.query("INSERT INTO configuracion_peaje_trayecto(id_trayecto,importe,fecha_inicio) SELECT id_trayecto,0,'2025-01-01' FROM trayecto");
        await admin.query("INSERT INTO configuracion_combustible(consumo_galones_km,precio_por_galon,fecha_inicio) VALUES (0.1,3,'2025-01-01'); INSERT INTO configuracion_viatico(importe_diario,fecha_inicio) VALUES (12,'2025-01-01')");
        await admin.query("COMMIT");
        pool.connect = isolated.connect.bind(isolated);
        pool.query = isolated.query.bind(isolated);
        const authenticatedFetch = await createAuthenticatedFetch(pool);
        server = require("../src/app").listen(0, "127.0.0.1");
        await new Promise(resolve => server.once("listening", resolve));
        const request = async (route, method = "GET", data) => {
            const response = await authenticatedFetch(`http://127.0.0.1:${server.address().port}/api${route}`, {
                method, headers: { "Content-Type": "application/json" }, body: data === undefined ? undefined : JSON.stringify(data)
            });
            return { status: response.status, body: await response.json() };
        };
        const generar = (id, desde, hasta=desde) => request("/remuneraciones-chofer/generar", "POST", { id_chofer: id, fecha_desde: desde, fecha_hasta: hasta });
        const horarios = new Map();
        const hora = fecha => { const h = (horarios.get(fecha) ?? 7) + 1; horarios.set(fecha,h); return String(h).padStart(2,'0'); };
        const viaje = (id, fecha, h = hora(fecha)) => request("/viajes", "POST", { id_vehiculo: 1, id_chofer: id, fecha_inicio: fecha+"T"+h+":00:00", fecha_fin: fecha+"T"+h+":30:00",
            tramos: [{ orden: 1, id_trayecto: 1 }], detalles: [{ id_gasolinera: 1, id_terminal: 1, id_producto_transportado: 1, galones: "50" }] });
        const anular = id => request(`/viajes/${id}/anular`, "POST", { motivo: "Prueba" });
        for (const fecha of ["2026-10-11", "2026-10-12"]) {
            assert.equal((await request("/feriados", "POST", { fecha, descripcion: "Feriado de prueba" })).status, 201);
        }
        assert.deepEqual((await generar(1,"2026-10-10","2026-10-12")).body.map(r=>r.total), ["35.00","0.00","35.00"]);
        assert.deepEqual((await generar(2,"2026-10-10","2026-10-12")).body.map(r=>r.total), ["0.00","0.00","0.00"]);
        const simultaneos = await Promise.all([viaje(1,"2026-10-12"),viaje(1,"2026-10-12"),viaje(1,"2026-10-12")]);
        assert.ok(simultaneos.every(r=>r.status===201), JSON.stringify(simultaneos));
        const costos = await isolated.query("SELECT valor FROM costo_viaje WHERE tipo_costo='CHOFER' ORDER BY id_viaje");
        assert.deepEqual(costos.rows.map(r=>r.valor), ["23.34","23.33","23.33"]);
        const diario = (await generar(1,"2026-10-12")).body[0];
        assert.equal(diario.total,"70.00");
        assert.equal(diario.costo_asignado,"70.00");
        assert.equal(diario.costo_sin_asignar,"0.00");
        const consultado = (await request(`/remuneraciones-chofer/${diario.id_remuneracion_chofer}`)).body;
        for (const campo of ["historial", "estado", "fecha_cierre"]) {
            assert.equal(Object.hasOwn(consultado, campo), false);
            assert.equal(Object.hasOwn(diario, campo), false);
        }
        assert.equal((await anular(simultaneos[0].body.id_viaje)).status,200);
        assert.deepEqual((await isolated.query("SELECT valor FROM costo_viaje WHERE tipo_costo='CHOFER' ORDER BY id_viaje")).rows.map(r=>r.valor), ["35.00","35.00"]);
        await anular(simultaneos[1].body.id_viaje);
        await anular(simultaneos[2].body.id_viaje);
        const sinViajes=(await generar(1,"2026-10-12")).body[0];
        assert.equal(sinViajes.total,"35.00");
        assert.equal(sinViajes.costo_sin_asignar,"35.00");
        assert.equal((await viaje(2,"2026-10-11")).status,201);
        assert.equal((await generar(2,"2026-10-11")).body[0].total,"70.00"); // domingo + feriado: un adicional
        assert.equal((await viaje(2,"2026-10-13")).status,201);
        assert.equal((await generar(2,"2026-10-13")).body[0].total,"35.00");
        assert.equal((await viaje(1,"2026-10-11")).status,201);
        assert.equal((await generar(1,"2026-10-11")).body[0].total,"70.00");
        for (const accion of ["cerrar", "reabrir"]) {
            const respuesta = await authenticatedFetch(`http://127.0.0.1:${server.address().port}/api/remuneraciones-chofer/${diario.id_remuneracion_chofer}/${accion}`, {
                method: "POST", body: JSON.stringify({ motivo: "Ruta retirada" })
            });
            assert.equal(respuesta.status, 404);
        }
        assert.equal((await request("/feriados", "POST", { fecha: "2026-10-13", descripcion: "Retroactivo" })).status,409);
        assert.equal((await request("/feriados/1", "DELETE")).status,409);
        const config={importe_diario:"35",adicional_dia_especial:"35",fecha_inicio:"2026-01-01",fecha_fin:"2026-12-31"};
        assert.equal((await request("/configuraciones-remuneracion/1","PUT",{...config,importe_diario:"40"})).status,409);
        assert.equal((await request("/configuraciones-remuneracion/1","PUT",config)).status,200);
        assert.equal((await request("/configuraciones-remuneracion","POST",{...config,fecha_inicio:"2026-12-31",fecha_fin:null})).status,409);
        assert.equal((await request("/configuraciones-remuneracion","POST",{...config,fecha_inicio:"2027-01-01",fecha_fin:null,importe_diario:"40"})).status,201);
        const configuraciones = await request("/configuraciones-remuneracion");
        assert.equal(configuraciones.status, 200);
        assert.deepEqual(configuraciones.body.map(r => r.fecha_inicio), ["2027-01-01", "2026-01-01"]);
        const feriados = await request("/feriados");
        assert.equal(feriados.status, 200);
        assert.deepEqual(feriados.body.map(r => r.fecha), ["2026-10-12", "2026-10-11"]);
        assert.equal((await generar(1,"2027-01-04")).body[0].total,"40.00");
        assert.equal((await generar(1,"2026-10-10")).body[0].total,"35.00");
        await isolated.query("UPDATE chofer SET tipo_remuneracion='DIA_TRABAJADO' WHERE id_chofer=1");
        assert.equal((await generar(1,"2026-10-10")).body[0].tipo_remuneracion_aplicado,"DIARIO_FIJO");
        assert.equal((await generar(1,"2026-10-14")).body[0].total,"0.00");
        await isolated.query("UPDATE tarifa SET fecha_inicio='2025-01-01'");
        const before=(await isolated.query("SELECT count(*)::int n FROM viaje")).rows[0].n;
        assert.equal((await viaje(1,"2025-12-31")).status,409);
        assert.equal((await isolated.query("SELECT count(*)::int n FROM viaje")).rows[0].n,before);
        assert.equal((await generar(1,"2025-12-31","2026-01-01")).status,409);
        assert.equal((await isolated.query("SELECT count(*)::int n FROM remuneracion_chofer WHERE fecha='2026-01-01'")).rows[0].n,0);
        assert.equal((await generar(1,"2026-01-01","2027-12-31")).status,400);
        assert.equal((await generar(999,"2026-10-10")).status,400);
    } finally {
        if (server) await new Promise(resolve=>server.close(resolve));
        pool.connect=connect; pool.query=query;
        await isolated.end();
        await admin.query("ROLLBACK");
        await admin.query("DROP SCHEMA IF EXISTS " + schema + " CASCADE");
        admin.release();
        await pool.end();
    }
});
