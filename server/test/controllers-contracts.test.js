const { test } = require("node:test");
const assert = require("node:assert/strict");
const viajes = require("../src/controllers/viajes.controller");
const viajesService = require("../src/services/viajes.service");
const vehiculos = require("../src/controllers/vehiculos.controller");
const vehiculosService = require("../src/services/vehiculos.service");

const response = () => ({
    statusCode: 200,
    sent: 0,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; this.sent++; return this; }
});

test("Controladores: creación devuelve 201 y pasa el cuerpo sin transformarlo", async (t) => {
    const body = { fecha_inicio: "2026-10-18T10:00", detalles: [] };
    const resultado = { id_viaje: 7, importe: "12.30" };
    t.mock.method(viajesService, "createViaje", async (data) => {
        assert.equal(data, body);
        return resultado;
    });
    const res = response();
    await viajes.createViaje({ body }, res, assert.fail);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body, resultado);
    assert.equal(res.sent, 1);
});

test("Controladores: eliminación conserva el mensaje y la entidad en la respuesta", async (t) => {
    const resultado = { id_vehiculo: 7 };
    t.mock.method(vehiculosService, "deleteVehiculo", async (id) => {
        assert.equal(id, "7");
        return resultado;
    });
    const res = response();
    await vehiculos.deleteVehiculo({ params: { id: "7" } }, res, assert.fail);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { message: "Vehículo eliminado correctamente", vehiculo: resultado });
    assert.equal(res.sent, 1);
});

test("Controladores: errores síncronos y rechazos llegan una sola vez a next sin responder", async (t) => {
    for (const synchronous of [true, false]) {
        const error = Object.assign(new Error("Conflicto simulado"), { status: 409 });
        const mock = t.mock.method(viajesService, "getViajeById", () => {
            if (synchronous) throw error;
            return Promise.reject(error);
        });
        const res = response();
        const errors = [];
        await viajes.getViajeById({ params: { id: "7" } }, res, (received) => errors.push(received));
        assert.deepEqual(errors, [error]);
        assert.equal(res.sent, 0);
        mock.mock.restore();
    }
});
