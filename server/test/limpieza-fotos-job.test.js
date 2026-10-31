const { test } = require("node:test");
const assert = require("node:assert/strict");
const archivoService = require("../src/services/archivo.service");
const almacenamiento = require("../src/config/almacenamiento");
const limpieza = require("../src/config/limpieza");
const { iniciarLimpiezaFotos } = require("../src/jobs/limpieza_fotos.job");
const dia = 24 * 60 * 60 * 1000;
const flush = () => new Promise(setImmediate);

const preparar = (t, config = { habilitada: true, intervaloMs: dia }) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    t.mock.method(limpieza, "getLimpiezaConfig", () => config);
    t.mock.method(almacenamiento, "getConfig", () => ({}));
    t.mock.method(console, "log", () => {});
    t.mock.method(console, "warn", () => {});
    t.mock.method(console, "error", () => {});
};

test("Limpieza automática: arranque diferido, frecuencia diaria y cancelación", async t => {
    preparar(t);
    const limpiar = t.mock.method(archivoService, "limpiarPendientes", async () => 2);
    const detener = iniciarLimpiezaFotos();
    t.mock.timers.tick(59999);
    assert.equal(limpiar.mock.callCount(), 0);
    t.mock.timers.tick(1);
    await flush();
    assert.equal(limpiar.mock.callCount(), 1);
    t.mock.timers.tick(dia - 1);
    assert.equal(limpiar.mock.callCount(), 1);
    t.mock.timers.tick(1);
    await flush();
    assert.equal(limpiar.mock.callCount(), 2);
    detener();
    t.mock.timers.tick(dia * 3);
    assert.equal(limpiar.mock.callCount(), 2);
});

test("Limpieza automática: un fallo no escapa y se vuelve a intentar al día siguiente", async t => {
    preparar(t);
    const limpiar = t.mock.method(archivoService, "limpiarPendientes", async () => { throw new Error("Fallo simulado"); });
    const detener = iniciarLimpiezaFotos();
    t.mock.timers.tick(60000);
    await flush();
    assert.equal(console.error.mock.callCount(), 1);
    limpiar.mock.mockImplementation(async () => 0);
    t.mock.timers.tick(dia);
    await flush();
    assert.equal(limpiar.mock.callCount(), 2);
    detener();
});

test("Limpieza automática: no solapa ejecuciones ni reinicia después de detenerse", async t => {
    preparar(t);
    let terminar;
    const limpiar = t.mock.method(archivoService, "limpiarPendientes", () => new Promise(resolve => { terminar = resolve; }));
    const detener = iniciarLimpiezaFotos();
    t.mock.timers.tick(60000);
    t.mock.timers.tick(dia * 3);
    assert.equal(limpiar.mock.callCount(), 1);
    detener();
    terminar(0);
    await flush();
    t.mock.timers.tick(dia * 3);
    assert.equal(limpiar.mock.callCount(), 1);
});

test("Limpieza automática: desactivada o sin configuración no toca archivos", async t => {
    preparar(t, { habilitada: false, intervaloMs: dia });
    const limpiar = t.mock.method(archivoService, "limpiarPendientes", async () => 0);
    iniciarLimpiezaFotos()();
    limpieza.getLimpiezaConfig.mock.mockImplementation(() => ({ habilitada: true, intervaloMs: dia }));
    almacenamiento.getConfig.mock.mockImplementation(() => { throw new Error("Sin configuración"); });
    iniciarLimpiezaFotos()();
    t.mock.timers.tick(dia * 3);
    await flush();
    assert.equal(limpiar.mock.callCount(), 0);
});
