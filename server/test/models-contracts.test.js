const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const pool = require("../src/config/database");

const modelDirectory = path.join(__dirname, "../src/models");
const models = fs.readdirSync(modelDirectory)
    .filter((name) => name.endsWith(".model.js"))
    .map((name) => [name, require(path.join(modelDirectory, name))]);

test("Modelos: buscar por ID usa el client recibido y devuelve fila o null", async () => {
    const originalQuery = pool.query;
    pool.query = async () => {
        assert.fail("La consulta salió del client de la transacción y utilizó el pool");
    };

    try {
        for (const [name, model] of models) {
            if (!model.findById) continue;
            const calls = [];
            let rows = [];
            const client = {
                query: async (sql, parameters) => {
                    calls.push({ sql, parameters });
                    return { rows };
                }
            };

            assert.equal(await model.findById(17, client), null, name);
            const row = { id: 17, importe: "12.34", fecha: "2026-10-18" };
            rows = [row];
            assert.equal(await model.findById(17, client), row, name);
            assert.equal(calls.length, 2, name);
            for (const call of calls) {
                assert.match(call.sql, /\$1/, name);
                assert.deepEqual(call.parameters, [17], name);
            }
        }
    } finally {
        pool.query = originalQuery;
    }
});

test("Modelos: búsquedas con bloqueo conservan client, parámetros y bloqueo SQL", async () => {
    const originalQuery = pool.query;
    pool.query = async () => assert.fail("Un bloqueo no debe usar el pool");

    try {
        for (const name of ["mantenimiento", "movimiento_inventario", "recepcion_compra"]) {
            const model = require(`../src/models/${name}.model`);
            assert.equal(typeof model.findByIdForUpdate, "function", name);
            assert.equal(model.findForUpdate, undefined, name);
        }
        for (const [name, model] of models) {
            for (const [method, clause] of [
                ["findByIdForUpdate", /FOR\s+UPDATE/i],
                ["findByIdForShare", /FOR\s+SHARE/i]
            ]) {
                if (!model[method]) continue;
                let calls = 0;
                const client = {
                    query: async (sql, parameters) => {
                        calls++;
                        assert.match(sql, clause, `${name}.${method}`);
                        assert.deepEqual(parameters, [23], `${name}.${method}`);
                        return { rows: [] };
                    }
                };
                assert.equal(await model[method](client, 23), null, `${name}.${method}`);
                assert.equal(calls, 1, `${name}.${method}`);
            }
        }
    } finally {
        pool.query = originalQuery;
    }
});

test("Modelos: un pago usa la transacción y conserva sus importes decimales", async () => {
    const model = require("../src/models/pago_proveedor.model");
    const originalQuery = pool.query;
    pool.query = async () => assert.fail("La escritura debe conservar el client recibido");
    const data = {
        id_factura_proveedor: 8,
        fecha_pago: "2026-10-18",
        monto: "1234567890.12",
        forma_pago: "TRANSFERENCIA",
        numero_cheque: null,
        numero_comprobante: "TRX-TEST",
        observacion: null
    };
    const row = { id_pago_proveedor: 4, ...data };
    let rows = [row];
    const client = {
        query: async (sql, parameters) => {
            assert.match(sql, /INSERT\s+INTO\s+pago_proveedor/i);
            assert.deepEqual(parameters, [8, "2026-10-18", "1234567890.12",
                "TRANSFERENCIA", null, "TRX-TEST", null]);
            return { rows };
        }
    };

    try {
        assert.equal(await model.create(client, data), row);
        rows = [];
        assert.equal(await model.create(client, data), null);
    } finally {
        pool.query = originalQuery;
    }
});
