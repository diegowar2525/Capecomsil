const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { validateImagenUrl } = require("../src/utils/validators/common.validators");

test("Imágenes: URLs opcionales y esquemas permitidos", () => {
    for (const value of [undefined, null, " "]) assert.equal(validateImagenUrl(value), null);
    assert.equal(validateImagenUrl(" https://example.com/foto.jpg "), "https://example.com/foto.jpg");
    for (const value of [true, {}, "archivo.jpg", "javascript:alert(1)", "data:image/png;base64,xxx", "https://user:pass@example.com/a", "https://example.com/" + "a".repeat(2048)]) {
        assert.throws(() => validateImagenUrl(value), { status: 400 });
    }
});

test("Imágenes: persistencia y lectura en los tres catálogos", async () => {
    const pool = require("../src/config/database");
    const client = await pool.connect();
    const originalQuery = pool.query;
    try {
        await client.query("BEGIN");
        await client.query("CREATE SCHEMA imagenes_test_" + process.pid);
        await client.query("SET LOCAL search_path TO imagenes_test_" + process.pid + ",public");
        await client.query(fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8"));
        await client.query("INSERT INTO categoria_producto(nombre) VALUES ('Test')");
        pool.query = client.query.bind(client);
        for (const [entity, data] of [
            ["vehiculo", { placa: "TEST", marca: "Marca", modelo: "Modelo", anio: 2026, capacidad_galones: 100 }],
            ["chofer", { nombre: "Test", cedula: "TEST", tipo_remuneracion: "SUELDO" }],
            ["producto", { id_categoria: 1, nombre: "Test", unidad_medida: "unidad" }]
        ]) {
            const model = require(`../src/models/${entity}.model`);
            const { validateData } = require(`../src/utils/validators/${entity}.validators`);
            const created = await model.create(validateData({ ...data, imagen_url: "https://example.com/uno.jpg" }));
            const id = created[`id_${entity}`];
            assert.equal(created.imagen_url, "https://example.com/uno.jpg");
            assert.equal((await model.findById(id)).imagen_url, created.imagen_url);
            assert.equal((await model.findAll())[0].imagen_url, created.imagen_url);
            const updated = await model.update(id, validateData({ ...data, imagen_url: "https://example.com/dos.jpg" }));
            assert.equal(updated.imagen_url, "https://example.com/dos.jpg");
            assert.equal((await model.update(id, validateData(data))).imagen_url, null);
        }
    } finally {
        pool.query = originalQuery;
        await client.query("ROLLBACK");
        client.release();
        await pool.end();
    }
});
