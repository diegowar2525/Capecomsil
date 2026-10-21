const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
const pool = require("../src/config/database");
const authService = require("../src/services/auth.service");
const sesionModel = require("../src/models/sesion.model");
const intentoModel = require("../src/models/autenticacion_intento.model");
const { createHash } = require("node:crypto");
const config = require("../src/config/auth");

test("Autenticación HTTP: instalación, cookies, CSRF, sesiones y cambio atómico de contraseña", async () => {
    const admin = await pool.connect();
    const connect = pool.connect;
    const query = pool.query;
    const schema = "auth_test_" + process.pid;
    const isolated = new Pool({ ...pool.options, password: pool.options.password, options: "-c search_path=" + schema + ",public" });
    let server;
    const password = "Una contraseña de prueba 2026";
    const nueva = "Otra contraseña distinta 2026";
    try {
        await admin.query("BEGIN");
        await admin.query(`CREATE SCHEMA ${schema}`);
        await admin.query(`SET LOCAL search_path TO ${schema},public`);
        const sql = fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8");
        // Aplicar realmente la migración 015 sobre el esquema anterior.
        await admin.query(sql.slice(0, sql.indexOf("-- Control persistente de intentos de autenticación.")));
        const migration = fs.readFileSync(path.join(__dirname, "../../database/migrations/015_autenticacion_intentos.sql"), "utf8");
        await admin.query(migration.replace(/^BEGIN;\s*/, "").replace(/COMMIT;\s*$/, ""));
        const revocacion = fs.readFileSync(path.join(__dirname, "../../database/migrations/016_revocacion_sesiones_usuario.sql"), "utf8");
        await admin.query(revocacion.replace(/^BEGIN;\s*/, "").replace(/COMMIT;\s*$/, ""));
        await admin.query("COMMIT");
        pool.connect = isolated.connect.bind(isolated);
        pool.query = isolated.query.bind(isolated);
        const jefe = await authService.crearPrimerJefe({ nombre_usuario: " Jefe.Test ", nombre: "Jefe", password });
        assert.equal(jefe.nombre_usuario, "jefe.test");
        assert.equal(jefe.rol, "JEFE");
        assert.equal(jefe.password_hash, undefined);
        await assert.rejects(authService.crearPrimerJefe({ nombre_usuario: "otro.jefe", nombre: "Otro", password }), { status: 409 });
        const stored = (await isolated.query("SELECT password_hash FROM usuario")).rows[0].password_hash;
        assert.match(stored, /^scrypt\$131072\$8\$1\$/);
        assert.ok(!stored.includes(password));

        server = require("../src/app").listen(0, "127.0.0.1");
        await new Promise((resolve) => server.once("listening", resolve));
        const base = `http://127.0.0.1:${server.address().port}/api/auth`;
        const request = async (route, { method = "GET", body, cookie, origin, csrf = true } = {}) => {
            const headers = {};
            if (method !== "GET") headers["Content-Type"] = "application/json";
            if (csrf) headers["X-CSRF-Protection"] = "1";
            if (cookie) headers.Cookie = cookie;
            if (origin) headers.Origin = origin;
            const response = await fetch(base + route, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
            return { status: response.status, headers: response.headers, body: await response.json() };
        };
        const login = async (cookie) => request("/login", { method: "POST", body: { nombre_usuario: "JEFE.TEST", password }, cookie });
        const cookieOf = (response) => response.headers.get("set-cookie").split(";")[0];
        assert.equal((await request("/me")).status, 401);
        assert.equal((await request("/login", { method: "POST", body: {}, csrf: false })).status, 403);
        assert.equal((await request("/login", { method: "POST", body: {}, origin: "https://evil.example" })).status, 403);
        const bad = await request("/login", { method: "POST", body: { nombre_usuario: "jefe.test", password: "incorrecta" } });
        const missing = await request("/login", { method: "POST", body: { nombre_usuario: "inexistente", password } });
        assert.equal(bad.status, 401);
        assert.deepEqual(bad.body, missing.body);
        const first = await login();
        assert.equal(first.status, 200);
        assert.match(first.headers.get("set-cookie"), /HttpOnly/);
        assert.match(first.headers.get("set-cookie"), /SameSite=Strict/);
        assert.equal(first.headers.get("cache-control"), "no-store");
        assert.equal(first.body.token, undefined);
        const cookie1 = cookieOf(first);
        const token = cookie1.split("=")[1];
        const hash = (await isolated.query("SELECT token_hash FROM sesion ORDER BY id_sesion DESC LIMIT 1")).rows[0].token_hash;
        assert.deepEqual(hash, createHash("sha256").update(token).digest());
        const me = await request("/me", { cookie: cookie1, origin: config.origins[0] });
        assert.equal(me.status, 200);
        assert.equal(me.headers.get("access-control-allow-origin"), config.origins[0]);
        assert.equal(me.headers.get("access-control-allow-credentials"), "true");
        assert.ok(me.body.permisos.includes("cierres.reabrir"));
        assert.equal(me.body.usuario.password_hash, undefined);

        const rotated = await login(cookie1);
        let cookie2 = cookieOf(rotated);
        assert.notEqual(cookie1, cookie2);
        assert.equal((await request("/me", { cookie: cookie1 })).status, 401);
        await isolated.query("UPDATE usuario SET activo=false");
        assert.equal((await request("/me", { cookie: cookie2 })).status, 401);
        assert.equal((await login()).status, 401);
        await isolated.query("UPDATE usuario SET activo=true, id_rol=(SELECT id_rol FROM rol WHERE codigo='OPERADOR')");
        assert.equal((await request("/me", { cookie: cookie2 })).status, 401);
        cookie2 = cookieOf(await login());
        const operator = await request("/me", { cookie: cookie2 });
        assert.equal(operator.body.usuario.rol, "OPERADOR");
        assert.ok(!operator.body.permisos.includes("cierres.reabrir"));
        await isolated.query("UPDATE usuario SET id_rol=(SELECT id_rol FROM rol WHERE codigo='JEFE')");
        assert.equal((await request("/logout", { method: "POST", body: {}, cookie: cookie2, csrf: false })).status, 403);
        assert.equal((await request("/me", { cookie: cookie2 })).status, 200);
        assert.equal((await request("/logout", { method: "POST", body: {}, cookie: cookie2 })).status, 200);
        assert.equal((await request("/me", { cookie: cookie2 })).status, 401);

        const cookie3 = cookieOf(await login());
        const cookie4 = cookieOf(await login());
        const change = { method: "PATCH", cookie: cookie3, body: { password_actual: password, password_nueva: nueva } };
        assert.equal((await request("/password", { ...change, body: { ...change.body, password_actual: "incorrecta" } })).status, 401);
        const originalRevoke = sesionModel.revocarByUsuario;
        sesionModel.revocarByUsuario = async () => { throw new Error("Fallo simulado de revocación"); };
        try {
            assert.equal((await request("/password", change)).status, 500);
            assert.equal((await isolated.query("SELECT password_hash FROM usuario")).rows[0].password_hash, stored);
            assert.equal((await request("/me", { cookie: cookie3 })).status, 200);
        } finally {
            sesionModel.revocarByUsuario = originalRevoke;
        }
        const changed = await request("/password", change);
        assert.equal(changed.status, 200);
        assert.match(changed.headers.get("set-cookie"), /Expires=Thu, 01 Jan 1970/);
        assert.equal((await request("/me", { cookie: cookie3 })).status, 401);
        assert.equal((await request("/me", { cookie: cookie4 })).status, 401);
        assert.equal((await login()).status, 401);
        const fresh = await request("/login", { method: "POST", body: { nombre_usuario: "jefe.test", password: nueva } });
        assert.equal(fresh.status, 200);
        assert.equal(fresh.body.usuario.requiere_cambio_password, false);
        await isolated.query("UPDATE sesion SET fecha_creacion=clock_timestamp()-interval '2 hours', fecha_expiracion=clock_timestamp()-interval '1 hour' WHERE fecha_revocacion IS NULL");
        assert.equal((await request("/me", { cookie: cookieOf(fresh) })).status, 401);

        // Cuenta bloqueada antes de ejecutar scrypt; el límite persiste entre peticiones.
        const key = createHash("sha256").update("login:cuenta:bloqueado").digest();
        const counts = await Promise.all(Array.from({ length: 10 }, () => intentoModel.registrar(key)));
        assert.deepEqual(counts.sort((a, b) => a - b), [1,2,3,4,5,6,7,8,9,10]);
        assert.equal((await request("/login", { method: "POST", body: { nombre_usuario: "bloqueado", password } })).status, 429);
        await isolated.query("UPDATE autenticacion_intento SET fecha_limite=clock_timestamp()-interval '1 second' WHERE clave_hash=$1", [key]);
        assert.equal(await intentoModel.registrar(key), 1);
    } finally {
        if (server) await new Promise((resolve) => server.close(resolve));
        pool.connect = connect;
        pool.query = query;
        await isolated.end();
        await admin.query("ROLLBACK");
        await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
        admin.release();
        await pool.end();
    }
});
