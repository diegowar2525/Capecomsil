const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { validateData } = require("../src/utils/validators/trayecto.validators");
const data = { nombre: " Salida ", id_gasolinera_origen: 1, id_terminal_destino: 1, kilometros: "11.50" };

test("Trayectos: referencias, kilómetros y booleanos", () => {
    assert.equal(validateData(data).nombre, "Salida");
    assert.equal(validateData(data).estado, true);
    for (const cambio of [{ nombre: " " }, { nombre: "a".repeat(151) }, { kilometros: 0 }, { kilometros: "1.001" },
        { estado: "true" }, { estado: null }, { id_terminal_origen: 1 }, { id_gasolinera_origen: null },
        { id_terminal_destino: null, id_gasolinera_destino: 1 }]) {
        assert.throws(() => validateData({ ...data, ...cambio }), { status: 400 });
    }
});

test("Trayectos: CRUD HTTP e historial", async () => {
    const pool = require("../src/config/database");
    const client = await pool.connect();
    const original = pool.query;
    let server;
    try {
        await client.query("BEGIN");
        await client.query(`CREATE SCHEMA trayectos_test_${process.pid}`);
        await client.query(`SET LOCAL search_path TO trayectos_test_${process.pid}, public`);
        await client.query(fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8"));
        await client.query("INSERT INTO gasolinera(nombre) VALUES ('Mechita'),('Otra'); INSERT INTO terminal(nombre) VALUES ('Troncal')");
        pool.query = client.query.bind(client);
        server = require("../src/app").listen(0, "127.0.0.1");
        await new Promise(resolve => server.once("listening", resolve));
        const request = async (method, suffix = "", payload = data) => {
            await client.query("SAVEPOINT peticion");
            const r = await fetch(`http://127.0.0.1:${server.address().port}/api/trayectos${suffix}`, {
                method, headers: { "Content-Type": "application/json" },
                ...(["GET", "DELETE"].includes(method) ? {} : { body: JSON.stringify(payload) })
            });
            const body = await r.json();
            if (r.status >= 400) await client.query("ROLLBACK TO SAVEPOINT peticion");
            await client.query("RELEASE SAVEPOINT peticion");
            return { status: r.status, body };
        };
        const created = await request("POST");
        assert.equal(created.status, 201);
        const id = created.body.id_trayecto;
        assert.equal((await request("GET", `/${id}`)).body.nombre_origen, "Mechita");
        assert.equal((await request("GET")).body.length, 1);
        assert.equal((await request("GET", "/abc")).status, 400);
        for (const method of ["GET", "PUT", "DELETE"]) assert.equal((await request(method, "/99999")).status, 404);
        assert.equal((await request("POST", "", { ...data, id_terminal_destino: 999 })).status, 400);
        assert.equal((await request("PUT", `/${id}`, { ...data, id_gasolinera_origen: 2 })).status, 200);
        assert.equal((await request("PUT", `/${id}`, data)).status, 200);
        const removable = await request("POST");
        assert.equal((await request("DELETE", `/${removable.body.id_trayecto}`)).status, 200);
        await client.query("INSERT INTO vehiculo(placa,capacidad_galones) VALUES ('TEST',100); INSERT INTO chofer(nombre,cedula,tipo_remuneracion) VALUES ('Prueba','TEST','SUELDO')");
        await client.query("INSERT INTO viaje(id_vehiculo,id_chofer,fecha_inicio,fecha_fin) VALUES (1,1,'2026-10-12','2026-10-12')");
        await client.query("INSERT INTO tramo_viaje(id_viaje,id_trayecto,orden) VALUES (1,$1,1)", [id]);
        await client.query("SET CONSTRAINTS ALL IMMEDIATE");
        assert.equal((await request("PUT", `/${id}`, { ...data, id_gasolinera_origen: 2 })).status, 409);
        assert.equal((await request("DELETE", `/${id}`)).status, 409);
        assert.equal((await request("PUT", `/${id}`, { ...data, kilometros: "15", estado: false })).status, 200);
        assert.equal((await request("GET", `/${id}`)).body.estado, false);
        assert.equal((await client.query("SELECT kilometros FROM tramo_viaje WHERE id_trayecto=$1", [id])).rows[0].kilometros, "11.50");
    } finally {
        if (server) await new Promise(resolve => server.close(resolve));
        pool.query = original;
        await client.query("ROLLBACK");
        client.release();
        await pool.end();
    }
});
