const { test } = require("node:test");
const assert = require("node:assert/strict");
const pool = require("../src/config/database");
const costoModel = require("../src/models/costo_viaje.model");
const combustibleModel = require("../src/models/configuracion_combustible.model");
const configuracionViaticoModel = require("../src/models/configuracion_viatico.model");
const viaticoModel = require("../src/models/viatico_chofer.model");
const viajeModel = require("../src/models/viaje.model");
const remuneracionModel = require("../src/models/remuneracion_chofer.model");
const costosService = require("../src/services/costos_viaje.service");
const viaticosService = require("../src/services/viaticos_chofer.service");
const remuneracionesService = require("../src/services/remuneraciones.service");

const fecha = "2026-10-18";

test("Costos: configuración ausente rechaza el registro antes de escribir", async (t) => {
    const client = {};
    t.mock.method(combustibleModel, "findVigenteForShare", async (connection, dia) => {
        assert.equal(connection, client);
        assert.equal(dia, fecha);
        return null;
    });
    const combustible = t.mock.method(costoModel, "createCombustible", async () => {});
    const peaje = t.mock.method(costoModel, "createPeaje", async () => {});

    await assert.rejects(costosService.crearAutomaticos(client, 7, fecha), { status: 409 });
    assert.equal(combustible.mock.callCount(), 0);
    assert.equal(peaje.mock.callCount(), 0);
});

test("Costos: comparte client y propaga fallos al dueño de la transacción", async (t) => {
    const client = {};
    const config = { id_configuracion_combustible: 2, consumo_galones_km: "0.100001", precio_por_galon: "3.1030" };
    const calls = [];
    const error = new Error("Fallo al registrar peaje");
    t.mock.method(combustibleModel, "findVigenteForShare", async () => config);
    t.mock.method(costoModel, "createCombustible", async (...args) => calls.push(args));
    t.mock.method(costoModel, "createPeaje", async (...args) => {
        calls.push(args);
        throw error;
    });

    await assert.rejects(costosService.crearAutomaticos(client, 7, fecha), (actual) => actual === error);
    assert.deepEqual(calls, [[client, 7, config], [client, 7]]);
});

function setupViatico(t, diario, cantidadViajes, config) {
    const client = {};
    const calls = [];
    const stub = (model, method, value) => t.mock.method(model, method, async (...args) => {
        assert.equal(args[0], client, method);
        calls.push({ method, args });
        return value;
    });
    stub(viaticoModel, "findByChoferFechaForUpdate", diario);
    stub(viajeModel, "countRegistradosByChoferFecha", cantidadViajes);
    stub(configuracionViaticoModel, "findVigenteForShare", config);
    stub(viaticoModel, "create", { id_viatico_chofer: 9, importe_diario_aplicado: "12.00" });
    stub(viaticoModel, "updateTotalPorViajes");
    stub(costoModel, "removeViaticosDeViajesAnulados");
    stub(costoModel, "asignarViaticoDiario");
    return { client, calls };
}

test("Viáticos: sin día ni viajes no exige configuración ni genera registros", async (t) => {
    const { client, calls } = setupViatico(t, null, 0, null);
    await viaticosService.recalcular(client, 3, fecha);
    assert.deepEqual(calls.map(({ method }) => method), [
        "findByChoferFechaForUpdate", "countRegistradosByChoferFecha"
    ]);
});

test("Viáticos: exige configuración al crear el día y conserva el importe histórico", async (t) => {
    const diario = { id_viatico_chofer: 9, importe_diario_aplicado: "12.00" };
    const config = { id_configuracion_viatico: 2, importe_diario: "12.00" };
    const { client, calls } = setupViatico(t, null, 3, config);
    await viaticosService.recalcular(client, 3, fecha);
    assert.deepEqual(calls.find(({ method }) => method === "create").args, [client, 3, fecha, config]);
    assert.deepEqual(calls.at(-1), {
        method: "asignarViaticoDiario", args: [client, 3, fecha, diario, 3]
    });
});

test("Viáticos: un día existente conserva su configuración al redistribuir", async (t) => {
    const diario = { id_viatico_chofer: 9, importe_diario_aplicado: "11.99" };
    const { client, calls } = setupViatico(t, diario, 2, { importe_diario: "25.00" });
    await viaticosService.recalcular(client, 3, fecha);
    assert.ok(!calls.some(({ method }) => ["create", "findVigenteForShare"].includes(method)));
    assert.deepEqual(calls.at(-1).args, [client, 3, fecha, diario, 2]);
});

test("Viáticos: anular el último viaje actualiza a cero y elimina asignaciones anuladas", async (t) => {
    const diario = { id_viatico_chofer: 9, importe_diario_aplicado: "12.00" };
    const { client, calls } = setupViatico(t, diario, 0, null);
    await viaticosService.recalcular(client, 3, fecha);
    assert.deepEqual(calls.slice(2), [
        { method: "updateTotalPorViajes", args: [client, 9, 0] },
        { method: "removeViaticosDeViajesAnulados", args: [client, 9] }
    ]);
});

test("Viáticos: configuración faltante impide crear y asignar el día", async (t) => {
    const { client, calls } = setupViatico(t, null, 1, null);
    await assert.rejects(viaticosService.recalcular(client, 3, fecha), { status: 409 });
    assert.deepEqual(calls.map(({ method }) => method), [
        "findByChoferFechaForUpdate", "countRegistradosByChoferFecha", "findVigenteForShare"
    ]);
});

for (const falla of [false, true]) {
    test(`Remuneraciones: período en una sola transacción con ${falla ? "rollback" : "commit"}`, async (t) => {
        const eventos = [];
        const dias = ["2026-10-17", "2026-10-18"];
        const error = new Error("Fallo del segundo día");
        const client = {
            query: async (sql) => { eventos.push(sql); },
            release: () => eventos.push("RELEASE")
        };
        t.mock.method(pool, "connect", async () => client);
        t.mock.method(remuneracionModel, "findFechasPeriodo", async (connection) => {
            assert.equal(connection, client);
            return dias.map((dia) => ({ fecha: dia }));
        });
        t.mock.method(remuneracionModel, "recalcular", async (connection, idChofer, dia) => {
            assert.equal(connection, client);
            assert.equal(idChofer, 3);
            eventos.push(dia);
            if (falla && dia === dias[1]) throw error;
        });
        const consulta = t.mock.method(remuneracionModel, "findAll", async (filtros, connection) => {
            assert.equal(connection, client);
            return [{ total: "35.00" }];
        });
        const request = remuneracionesService.generar({
            id_chofer: 3, fecha_desde: dias[0], fecha_hasta: dias[1]
        });

        if (falla) {
            await assert.rejects(request, (actual) => actual === error);
            assert.equal(consulta.mock.callCount(), 0);
        } else {
            assert.deepEqual(await request, [{ total: "35.00" }]);
        }
        assert.deepEqual(eventos, [
            "BEGIN", "SELECT pg_advisory_xact_lock(72631,1)",
            ...dias, falla ? "ROLLBACK" : "COMMIT", "RELEASE"
        ]);
    });
}
