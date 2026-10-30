const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");
const { Pool } = require("pg");
const pool = require("../src/config/database");
const { MAX_BYTES } = require("../src/utils/validators/foto.validators");
const { prepararFoto } = require("../src/services/imagen.service");
const almacenamiento = require("../src/services/almacenamiento.service");
const fotos = require("../src/services/archivo.service");
const { createAuthenticatedFetch } = require("./helpers/authenticated-fetch");

test("Fotos: comprueba el contenido real, limita tamaño y transforma la imagen", async () => {
    const png = await sharp({ create: { width: 800, height: 600, channels: 3, background: "red" } }).png().toBuffer();
    const result = await prepararFoto({ buffer: png, mimetype: "text/plain" });
    const metadata = await sharp(result).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, 512);
    assert.equal(metadata.height, 512);
    assert.equal(metadata.exif, undefined);
    const catalogo = await prepararFoto({ buffer: png }, { lado: 1024, ajuste: "inside" });
    const catalogoMetadata = await sharp(catalogo).metadata();
    assert.equal(catalogoMetadata.width, 800);
    assert.equal(catalogoMetadata.height, 600);
    await assert.rejects(prepararFoto({ buffer: Buffer.from("no soy una foto"), mimetype: "image/png" }), { status: 400 });
    await assert.rejects(prepararFoto({ buffer: Buffer.alloc(MAX_BYTES + 1) }), { status: 413 });
    await assert.rejects(prepararFoto(), { status: 400 });
    await assert.rejects(prepararFoto({ buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"/>') }), { status: 400 });
});

test("Fotos HTTP: permisos, reemplazo atómico, rollback y limpieza recuperable", async (t) => {
    const admin = await pool.connect();
    const schemaName = "fotos_usuario_" + process.pid;
    const isolated = new Pool({ ...pool.options, password: pool.options.password, options: "-c search_path=" + schemaName + ",public" });
    let server;
    try {
        await admin.query("BEGIN");
        await admin.query(`CREATE SCHEMA ${schemaName}`);
        await admin.query(`SET LOCAL search_path TO ${schemaName},public`);
        const schema = fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8");
        await admin.query(schema.split("-- Fotos de perfil: almacenamiento privado y limpieza diferida.")[0]);
        const migration = fs.readFileSync(path.join(__dirname, "../../database/migrations/026_fotos_usuario.sql"), "utf8");
        await admin.query(migration.replace(/^BEGIN;\s*/, "").replace(/COMMIT;\s*$/, ""));
        const catalogoMigration = fs.readFileSync(path.join(__dirname, "../../database/migrations/027_fotos_catalogos.sql"), "utf8");
        await admin.query(catalogoMigration.replace(/^BEGIN;\s*/, "").replace(/COMMIT;\s*$/, ""));
        await admin.query("COMMIT");
        t.mock.method(pool, "query", isolated.query.bind(isolated));
        t.mock.method(pool, "connect", isolated.connect.bind(isolated));
        for (const [key, value] of Object.entries({ R2_ACCOUNT_ID: "a".repeat(32), R2_ACCESS_KEY_ID: "test", R2_SECRET_ACCESS_KEY: "test", R2_BUCKET: "test", API_PUBLIC_URL: "http://localhost:5173" })) {
            const previous = process.env[key];
            process.env[key] = value;
            t.after(() => previous === undefined ? delete process.env[key] : process.env[key] = previous);
        }
        const archivos = new Map();
        t.mock.method(almacenamiento, "guardar", async (key, buffer) => archivos.set(key, buffer));
        t.mock.method(almacenamiento, "obtener", async key => archivos.get(key));
        const borrar = t.mock.method(almacenamiento, "eliminar", async key => archivos.delete(key));
        const operador = await createAuthenticatedFetch(isolated, "OPERADOR");
        server = require("../src/app").listen(0, "127.0.0.1");
        await new Promise(resolve => server.once("listening", resolve));
        const base = `http://127.0.0.1:${server.address().port}/api/auth`;
        const png = await sharp({ create: { width: 30, height: 30, channels: 3, background: "blue" } }).png().toBuffer();
        const subir = (buffer = png, headers = {}, field = "foto") => {
            const body = new FormData();
            body.append(field, new Blob([buffer], { type: "image/png" }), "foto.png");
            return fetch(base + "/me/foto", { method: "PUT", body,
                headers: { Cookie: operador.cookie, "X-CSRF-Protection": "1", ...headers } });
        };
        assert.equal((await subir(png, { Cookie: "" })).status, 401);
        assert.equal((await subir(png, { "X-CSRF-Protection": "" })).status, 403);
        assert.equal((await subir(png, { Origin: "https://otro.example" })).status, 403);
        assert.equal((await subir(Buffer.from("texto"))).status, 400);
        assert.equal((await subir(png, {}, "otro")).status, 400);
        assert.equal((await subir(Buffer.alloc(MAX_BYTES + 1))).status, 413);
        const response = await subir();
        assert.equal(response.status, 200, await response.clone().text());
        const usuario = await response.json();
        assert.match(usuario.imagen_url, /\/api\/auth\/fotos\//);
        assert.equal(usuario.id_usuario, operador.idUsuario);
        const urlFoto = base + "/fotos/" + operador.idUsuario;
        assert.equal((await fetch(urlFoto)).status, 401);
        const imagen = await operador(urlFoto);
        assert.equal(imagen.status, 200);
        assert.equal(imagen.headers.get("content-type"), "image/webp");
        assert.match(imagen.headers.get("cache-control"), /no-store/);
        assert.equal((await sharp(Buffer.from(await imagen.arrayBuffer())).metadata()).format, "webp");

        // Una caída del almacenamiento conserva la foto actual.
        almacenamiento.guardar.mock.mockImplementationOnce(async () => { throw Object.assign(new Error("R2 no disponible"), { status: 503 }); });
        assert.equal((await subir()).status, 503);
        assert.equal((await operador(base + "/me").then(r => r.json())).usuario.imagen_url, usuario.imagen_url);

        // Una caída después de subir, durante la transacción, conserva la foto anterior.
        const historial = require("../src/models/usuario_historial.model");
        const audit = t.mock.method(historial, "create");
        audit.mock.mockImplementationOnce(async () => { throw new Error("Fallo simulado"); });
        assert.equal((await subir()).status, 500);
        assert.equal((await operador(base + "/me").then(r => r.json())).usuario.imagen_url, usuario.imagen_url);
        assert.equal((await subir()).status, 200);
        assert.equal(archivos.size, 3);
        await isolated.query("UPDATE archivo_borrado_pendiente SET disponible_desde = clock_timestamp()");
        borrar.mock.mockImplementationOnce(async () => { throw new Error("Fallo simulado al borrar"); });
        await assert.rejects(fotos.limpiarPendientes());
        assert.equal(archivos.size, 3);
        await fotos.limpiarPendientes();
        assert.equal(archivos.size, 1);

        // Editar la URL por la API anterior también encola la foto gestionada.
        const edit = await operador(base + "/me", { method: "PATCH", body: JSON.stringify({ imagen_url: "https://example.com/avatar.png" }) });
        assert.equal(edit.status, 200);
        assert.equal((await operador(urlFoto)).status, 404);
        await fotos.limpiarPendientes();
        assert.equal(archivos.size, 0);
        assert.equal((await subir()).status, 200);
        assert.equal((await operador(base + "/me/foto", { method: "DELETE" })).status, 200);
        assert.equal((await operador(base + "/me/foto", { method: "DELETE" })).status, 200);
        await fotos.limpiarPendientes();
        assert.equal(archivos.size, 0);
        // Los tres catálogos conservan sus permisos y usan la misma limpieza.
        const apiBase = base.replace(/\/auth$/, "");
        const categoria = (await isolated.query("INSERT INTO categoria_producto(nombre) VALUES ('Fotos') RETURNING id_categoria")).rows[0];
        const casos = [
            { recurso: "choferes", key: "id_chofer", data: { nombre: "Chofer foto", cedula: "foto-test", tipo_remuneracion: "DIARIO_FIJO" } },
            { recurso: "vehiculos", key: "id_vehiculo", data: { placa: "FOTO-001", marca: "Test", modelo: "Test", anio: 2025, capacidad_galones: 4000 } },
            { recurso: "productos", key: "id_producto", data: { id_categoria: categoria.id_categoria, nombre: "Producto foto", unidad_medida: "unidad" } }
        ];
        for (const caso of casos) {
            const create = await operador(`${apiBase}/${caso.recurso}`, { method: "POST", body: JSON.stringify(caso.data) });
            assert.equal(create.status, 201, await create.clone().text());
            const registro = await create.json();
            const ruta = `${apiBase}/fotos/${caso.recurso}/${registro[caso.key]}`;
            const upload = (headers = {}) => {
                const body = new FormData();
                body.append("foto", new Blob([png], { type: "image/png" }), "imagen.png");
                return fetch(ruta, { method: "PUT", body, headers: { Cookie: operador.cookie, "X-CSRF-Protection": "1", ...headers } });
            };
            assert.equal((await upload({ Cookie: "" })).status, 401);
            assert.equal((await upload({ "X-CSRF-Protection": "" })).status, 403);
            const first = await upload();
            assert.equal(first.status, 200, await first.clone().text());
            const anterior = await first.json();
            assert.equal((await operador(ruta)).status, 200);
            almacenamiento.guardar.mock.mockImplementationOnce(async () => { throw Object.assign(new Error("R2 no disponible"), { status: 503 }); });
            assert.equal((await upload()).status, 503);
            assert.equal((await operador(`${apiBase}/${caso.recurso}/${registro[caso.key]}`).then(r => r.json())).imagen_url, anterior.imagen_url);
            assert.equal((await upload()).status, 200);
            await fotos.limpiarPendientes();
            assert.equal(archivos.size, 1);
            assert.equal((await operador(ruta, { method: "DELETE" })).status, 200);
            assert.equal((await operador(ruta)).status, 404);
            await fotos.limpiarPendientes();
            assert.equal(archivos.size, 0);
            assert.equal((await upload()).status, 200);
            // Borrar el registro también encola su objeto, antes del cascade.
            assert.equal((await operador(`${apiBase}/${caso.recurso}/${registro[caso.key]}`, { method: "DELETE" })).status, 200);
            await fotos.limpiarPendientes();
            assert.equal(archivos.size, 0);
        }
        assert.equal((await operador(`${apiBase}/fotos/usuarios/1`)).status, 404);
        await isolated.query(`DELETE FROM rol_permiso WHERE id_rol = (SELECT id_rol FROM rol WHERE codigo='OPERADOR')
            AND id_permiso = (SELECT id_permiso FROM permiso WHERE codigo='catalogos.editar')`);
        assert.equal((await operador(`${apiBase}/fotos/choferes/1`, { method: "DELETE" })).status, 403);
        await isolated.query("UPDATE usuario SET requiere_cambio_password = true WHERE id_usuario=$1", [operador.idUsuario]);
        assert.equal((await subir()).status, 403);
    } catch (error) {
        console.error("Prueba de fotos:", error.message);
        throw error;
    } finally {
        if (server) {
            server.closeAllConnections();
            await new Promise(resolve => server.close(resolve));
        }
        t.mock.restoreAll();
        await isolated.end();
        await admin.query("ROLLBACK");
        await admin.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
        admin.release();
        await pool.end();
    }
});
