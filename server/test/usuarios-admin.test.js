const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
const pool = require("../src/config/database");
const { createAuthenticatedFetch } = require("./helpers/authenticated-fetch");
const validators = require("../src/utils/validators/usuario.validators");
const historialModel = require("../src/models/usuario_historial.model");
const { verifyPassword } = require("../src/utils/password");

test("Administración: validación estricta de perfiles, estados y credenciales", () => {
    const perfil = { nombre_usuario: " Operador.Test ", nombre: " Operador ", id_rol: 2 };
    assert.equal(validators.validateEdicion(perfil).nombre_usuario, "operador.test");
    for (const data of [null, [], {}, { ...perfil, activo: false }, { ...perfil, password_hash: "x" }, { ...perfil, id_rol: true }]) {
        assert.throws(() => validators.validateEdicion(data), { status: 400 });
    }
    assert.throws(() => validators.validateCreacion({ ...perfil, password_temporal: "corta" }), { status: 400 });
    assert.throws(() => validators.validateEstado({ activo: "false", motivo: "Baja" }), { status: 400 });
    assert.throws(() => validators.validateEstado({ activo: false, motivo: " " }), { status: 400 });
    assert.throws(() => validators.validateRestablecimiento({ password_temporal: "Temporal de pruebas larga" }), { status: 400 });
});

test("Administración HTTP: ciclo de cuentas, historial atómico y último jefe concurrente", async (t) => {
    const admin = await pool.connect();
    const originalQuery = pool.query;
    const originalConnect = pool.connect;
    const schemaName = "usuarios_admin_" + process.pid;
    const isolated = new Pool({ ...pool.options, password: pool.options.password, options: "-c search_path=" + schemaName + ",public" });
    let server;
    try {
        await admin.query("BEGIN");
        await admin.query(`CREATE SCHEMA ${schemaName}`);
        await admin.query(`SET LOCAL search_path TO ${schemaName},public`);
        const schema = fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8");
        await admin.query(schema.split("-- Historial administrativo de usuarios, sin credenciales.")[0]);
        const migration = fs.readFileSync(path.join(__dirname, "../../database/migrations/017_administracion_usuarios.sql"), "utf8");
        await admin.query(migration.replace(/^BEGIN;\s*/, "").replace(/COMMIT;\s*$/, ""));
        await admin.query("COMMIT");
        pool.query = isolated.query.bind(isolated);
        pool.connect = isolated.connect.bind(isolated);
        const jefe = await createAuthenticatedFetch(isolated);
        const operador = await createAuthenticatedFetch(isolated, "OPERADOR");
        const roles = (await isolated.query("SELECT id_rol,codigo FROM rol")).rows;
        const rolJefe = roles.find((rol) => rol.codigo === "JEFE").id_rol;
        const rolOperador = roles.find((rol) => rol.codigo === "OPERADOR").id_rol;
        server = require("../src/app").listen(0, "127.0.0.1");
        await new Promise((resolve) => server.once("listening", resolve));
        const base = `http://127.0.0.1:${server.address().port}/api`;
        const request = (client, route, method = "GET", data) => client(base + route, {
            method, ...(data === undefined ? {} : { body: JSON.stringify(data) })
        });
        const perfil = { nombre_usuario: "nuevo.operador", nombre: "Nuevo operador", id_rol: rolOperador };
        const temporal = "Temporal inicial de pruebas 123";
        const passwordNueva = "Contraseña personal de pruebas 456";
        for (const [method, route] of [["POST", "/usuarios"], ["PUT", "/usuarios/1"], ["PATCH", "/usuarios/1/estado"], ["POST", "/usuarios/1/restablecer-password"]]) {
            assert.equal((await request(operador, route, method, {})).status, 403);
        }
        const creado = await request(jefe, "/usuarios", "POST", { ...perfil, password_temporal: temporal });
        assert.equal(creado.status, 201);
        const usuario = await creado.json();
        assert.equal(usuario.requiere_cambio_password, true);
        assert.equal(Object.hasOwn(usuario, "password_hash"), false);
        const route = "/usuarios/" + usuario.id_usuario;
        const credenciales = (await isolated.query("SELECT password_hash FROM usuario WHERE id_usuario=$1", [usuario.id_usuario])).rows[0];
        assert.notEqual(credenciales.password_hash, temporal);
        assert.ok(await verifyPassword(temporal, credenciales.password_hash));
        assert.equal((await request(jefe, "/usuarios", "POST", { ...perfil, password_temporal: temporal })).status, 409);
        assert.equal((await request(jefe, route, "PUT", { ...perfil, id_rol: 2147483647 })).status, 404);
        const authRequest = (route, data, cookie, method = "POST") => fetch(base + route, {
            method, headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1", ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(data)
        });
        const login = (password) => authRequest("/auth/login", { nombre_usuario: perfil.nombre_usuario, password });
        const logged = await login(temporal);
        assert.equal(logged.status, 200);
        const cookie = logged.headers.get("set-cookie").split(";")[0];
        assert.equal((await fetch(base + "/viajes", { headers: { Cookie: cookie } })).status, 403);
        assert.equal((await authRequest("/auth/password", { password_actual: temporal, password_nueva: passwordNueva }, cookie, "PATCH")).status, 200);
        const loggedAgain = await login(passwordNueva);
        assert.equal(loggedAgain.status, 200);
        const cookieNueva = loggedAgain.headers.get("set-cookie").split(";")[0];
        assert.equal((await fetch(base + "/viajes", { headers: { Cookie: cookieNueva } })).status, 200);

        // El fallo del historial revierte también el perfil y la revocación de sesiones.
        const mock = t.mock.method(historialModel, "create", async () => { throw new Error("Fallo simulado"); });
        assert.equal((await request(jefe, route, "PUT", { ...perfil, nombre_usuario: "otro.nombre" })).status, 500);
        mock.mock.restore();
        assert.equal((await fetch(base + "/viajes", { headers: { Cookie: cookieNueva } })).status, 200);
        assert.equal((await request(jefe, route, "PUT", { ...perfil, nombre: "Nombre actualizado" })).status, 200);
        assert.equal((await request(jefe, route + "/estado", "PATCH", { activo: false, motivo: "Fin de labores" })).status, 200);
        assert.equal((await fetch(base + "/viajes", { headers: { Cookie: cookieNueva } })).status, 401);
        assert.equal((await login(passwordNueva)).status, 401);
        assert.equal((await request(jefe, route + "/estado", "PATCH", { activo: true, motivo: "Reingreso" })).status, 200);
        assert.equal((await fetch(base + "/viajes", { headers: { Cookie: cookieNueva } })).status, 401);
        const cookieActiva = (await login(passwordNueva)).headers.get("set-cookie").split(";")[0];
        const temporalNueva = "Temporal restablecida de pruebas 789";
        assert.equal((await request(jefe, route + "/restablecer-password", "POST", { password_temporal: temporalNueva, motivo: "Contraseña olvidada" })).status, 200);
        assert.equal((await fetch(base + "/viajes", { headers: { Cookie: cookieActiva } })).status, 401);
        assert.equal((await login(passwordNueva)).status, 401);
        const resetLogin = await login(temporalNueva);
        assert.equal(resetLogin.status, 200);
        assert.equal((await resetLogin.json()).usuario.requiere_cambio_password, true);
        const historial = await (await request(jefe, route + "/historial")).json();
        assert.equal(historial.length, 5);
        assert.ok(historial.every((item) => item.id_actor === jefe.idUsuario));
        assert.ok(!JSON.stringify(historial).includes(temporalNueva));
        assert.ok(!JSON.stringify(historial).includes("password_hash"));
        assert.equal((await request(jefe, `/usuarios/${jefe.idUsuario}/estado`, "PATCH", { activo: false, motivo: "Prueba" })).status, 409);
        const jefePerfil = await (await request(jefe, `/usuarios/${jefe.idUsuario}`)).json();
        assert.equal((await request(jefe, `/usuarios/${jefe.idUsuario}`, "PUT", { nombre_usuario: jefePerfil.nombre_usuario, nombre: jefePerfil.nombre, id_rol: rolOperador })).status, 409);
        assert.equal((await request(jefe, `/usuarios/${jefe.idUsuario}/restablecer-password`, "POST", { password_temporal: temporal, motivo: "Prueba" })).status, 409);

        const segundo = await createAuthenticatedFetch(isolated);
        const segundoPerfil = await (await request(segundo, `/usuarios/${segundo.idUsuario}`)).json();
        const respuestas = await Promise.all([
            request(jefe, `/usuarios/${jefe.idUsuario}`, "PUT", { nombre_usuario: jefePerfil.nombre_usuario, nombre: jefePerfil.nombre, id_rol: rolOperador }),
            request(segundo, `/usuarios/${segundo.idUsuario}`, "PUT", { nombre_usuario: segundoPerfil.nombre_usuario, nombre: segundoPerfil.nombre, id_rol: rolOperador })
        ]);
        assert.deepEqual(respuestas.map((res) => res.status).sort(), [200, 409]);
        assert.equal((await isolated.query("SELECT count(*)::int n FROM usuario WHERE activo AND id_rol=$1", [rolJefe])).rows[0].n, 1);
        const perdedor = respuestas[0].status === 200 ? jefe : segundo;
        assert.equal((await request(perdedor, "/usuarios")).status, 401);
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
