const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
const pool = require("../src/config/database");
const { createAuthenticatedFetch } = require("./helpers/authenticated-fetch");
const { exigirPermiso } = require("../src/middlewares/auth.middleware");

const mounts = {
    tarifas_capacidad: "tarifas-capacidad", modalidades_tarifa: "modalidades-tarifa",
    abastecimientos_combustible: "abastecimientos-combustible", categorias_producto: "categorias-producto",
    choferes: "choferes", configuracion_combustible: "configuraciones-combustible",
    configuracion_peaje_trayecto: "configuraciones-peaje-trayecto", configuracion_remuneracion: "configuraciones-remuneracion",
    configuracion_viatico: "configuraciones-viatico", facturas_proveedor: "facturas-proveedor", feriado: "feriados",
    gasolineras: "gasolineras", gastos: "gastos", informes: "informes", inventario: "inventario",
    mantenimientos: "mantenimientos", pagos_proveedor: "pagos-proveedor", planes_mantenimiento: "planes-mantenimiento",
    productos_transportados: "productos-transportados", productos: "productos", proveedores: "proveedores",
    recepciones_compra: "recepciones-compra", remuneraciones: "remuneraciones-chofer", tarifas: "tarifas",
    terminales: "terminales", trayectos: "trayectos", vehiculos: "vehiculos", viajes: "viajes",
    usuarios: "usuarios", roles: "roles", permisos: "permisos", liquidaciones: "liquidaciones"
};

test("Permisos: toda ruta operativa declara un permiso existente", () => {
    const files = fs.readdirSync(path.join(__dirname, "../src/routes"))
        .filter((file) => file.endsWith(".routes.js") && file !== "auth.routes.js");
    assert.deepEqual(files.map((file) => file.replace(".routes.js", "")).sort(), Object.keys(mounts).sort());
    const schema = fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8");
    const codes = new Set([...schema.matchAll(/\('([a-z_]+\.[a-z_]+)'/g)].map((match) => match[1]));
    for (const file of files) {
        const router = require("../src/routes/" + file);
        for (const layer of router.stack.filter((item) => item.route)) {
            const permiso = layer.route.stack[0].handle.permiso;
            assert.ok(codes.has(permiso), `${file}: ${layer.route.path} sin permiso válido`);
        }
    }
    assert.throws(() => exigirPermiso(undefined));
});

test("Permisos HTTP: sesiones reales, jefe/operador, CSRF y revocación inmediata", async () => {
    const admin = await pool.connect();
    const connect = pool.connect;
    const query = pool.query;
    const schema = "permisos_test_" + process.pid;
    const isolated = new Pool({ ...pool.options, password: pool.options.password, options: "-c search_path=" + schema + ",public" });
    let server;
    try {
        await admin.query("BEGIN");
        await admin.query(`CREATE SCHEMA ${schema}`);
        await admin.query(`SET LOCAL search_path TO ${schema},public`);
        await admin.query(fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8"));
        await admin.query("COMMIT");
        pool.connect = isolated.connect.bind(isolated);
        pool.query = isolated.query.bind(isolated);
        const jefe = await createAuthenticatedFetch(isolated);
        const operador = await createAuthenticatedFetch(isolated, "OPERADOR");
        server = require("../src/app").listen(0, "127.0.0.1");
        await new Promise((resolve) => server.once("listening", resolve));
        const base = `http://127.0.0.1:${server.address().port}/api`;
        const request = (client, route, method = "GET", body) => client(base + route, {
            method, ...(body === undefined ? {} : { body: JSON.stringify(body) })
        });
        assert.equal((await fetch(base + "/health")).status, 200);
        // Revisar cada ruta, incluyendo acciones anidadas y POST de anulaciones.
        for (const [file, mount] of Object.entries(mounts)) {
            for (const layer of require(`../src/routes/${file}.routes`).stack.filter((item) => item.route)) {
                for (const method of Object.keys(layer.route.methods)) {
                    const route = `/${mount}${layer.route.path.replace(":id", "2147483647")}`;
                    assert.equal((await request(fetch, route, method.toUpperCase())).status, 401, `${method} ${route}`);
                }
            }
        }
        assert.equal((await request(operador, "/viajes")).status, 200);
        assert.equal((await request(operador, "/tarifas")).status, 200);
        for (const route of ["/tarifas", "/configuraciones-combustible", "/configuraciones-viatico", "/feriados"]) {
            for (const method of ["POST", "PUT", "DELETE"]) {
                assert.equal((await request(operador, route + (method === "POST" ? "" : "/1"), method, {})).status, 403);
            }
        }
        for (const route of ["/usuarios", "/roles", "/permisos", "/roles/1/permisos"]) {
            assert.equal((await request(operador, route)).status, 403);
            assert.equal((await request(jefe, route)).status, 200);
        }
        const usuarios = await (await request(jefe, "/usuarios")).json();
        assert.ok(usuarios.every((usuario) => !Object.hasOwn(usuario, "password_hash")));
        const creado = await request(operador, "/categorias-producto", "POST", { nombre: "Prueba autorizada" });
        assert.equal(creado.status, 201);
        const idCategoria = (await creado.json()).id_categoria;
        assert.equal((await request(operador, `/categorias-producto/${idCategoria}`, "DELETE")).status, 200);
        const feriado = await request(jefe, "/feriados", "POST", { fecha: "2026-10-20", descripcion: "Prueba autorizada" });
        assert.equal(feriado.status, 201);

        // La lectura de pagos no debe quedar autorizada por catalogos/compras.
        await isolated.query(`DELETE FROM rol_permiso WHERE id_rol=(SELECT id_rol FROM rol WHERE codigo='OPERADOR')
            AND id_permiso=(SELECT id_permiso FROM permiso WHERE codigo='pagos_proveedor.consultar')`);
        for (const route of ["/pagos-proveedor", "/proveedores/1/cuentas-por-pagar", "/facturas-proveedor/1/pagos"]) {
            assert.equal((await request(operador, route)).status, 403);
        }
        // No hay bypass automático para JEFE: también necesita el permiso asignado.
        await isolated.query(`DELETE FROM rol_permiso WHERE id_rol=(SELECT id_rol FROM rol WHERE codigo='JEFE')
            AND id_permiso=(SELECT id_permiso FROM permiso WHERE codigo='catalogos.consultar')`);
        assert.equal((await request(jefe, "/vehiculos")).status, 403);
        assert.equal((await request(jefe, "/vehiculos", "HEAD")).status, 403);
        await isolated.query(`INSERT INTO rol_permiso SELECT id_rol,id_permiso FROM rol CROSS JOIN permiso
            WHERE rol.codigo='JEFE' AND permiso.codigo='catalogos.consultar'`);
        assert.equal((await request(jefe, "/vehiculos")).status, 200);
        for (const headers of [
            { Cookie: jefe.cookie, "Content-Type": "application/json" },
            { Cookie: jefe.cookie, "Content-Type": "application/json", "X-CSRF-Protection": "1", Origin: "https://evil.example" },
            { Cookie: jefe.cookie, "Content-Type": "text/plain", "X-CSRF-Protection": "1" }
        ]) {
            assert.equal((await fetch(base + "/categorias-producto", { method: "POST", headers, body: '{}' })).status, 403);
        }
        assert.equal((await isolated.query("SELECT count(*)::int n FROM categoria_producto")).rows[0].n, 0);

        await isolated.query("UPDATE usuario SET requiere_cambio_password=true WHERE id_usuario=$1", [operador.idUsuario]);
        assert.equal((await request(operador, "/viajes")).status, 403);
        assert.equal((await request(operador, "/auth/me")).status, 200);
        assert.equal((await request(operador, "/auth/password", "PATCH", {})).status, 400);
        await isolated.query("UPDATE usuario SET requiere_cambio_password=false, activo=false WHERE id_usuario=$1", [operador.idUsuario]);
        assert.equal((await request(operador, "/viajes")).status, 401);
        await isolated.query("UPDATE usuario SET activo=true WHERE id_usuario=$1", [operador.idUsuario]);
        assert.equal((await request(operador, "/viajes")).status, 401);
        assert.ok((await isolated.query("SELECT fecha_revocacion FROM sesion WHERE id_usuario=$1", [operador.idUsuario])).rows[0].fecha_revocacion);
        await isolated.query("UPDATE usuario SET id_rol=(SELECT id_rol FROM rol WHERE codigo='OPERADOR') WHERE id_usuario=$1", [jefe.idUsuario]);
        assert.equal((await request(jefe, "/usuarios")).status, 403);
        await isolated.query("UPDATE usuario SET password_hash='otro_hash_sintetico' WHERE id_usuario=$1", [jefe.idUsuario]);
        assert.equal((await request(jefe, "/viajes")).status, 401);
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
