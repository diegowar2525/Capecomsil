const { test } = require("node:test");
const assert = require("node:assert/strict");
const common = require("../src/utils/validators/common.validators");

test("Validadores: fechas reales y horas locales conservan su normalización", () => {
    assert.equal(common.validateDate("2024-02-29"), "2024-02-29");
    assert.throws(() => common.validateDate("2026-02-29"), {
        status: 400,
        message: "La fecha no existe en el calendario"
    });
    assert.equal(common.validateDateTime("2026-10-18 09:30"), "2026-10-18T09:30:00");
    assert.equal(common.validateDateTime("2026-10-18"), "2026-10-18T00:00:00");
    for (const value of ["2026-10-18T24:00", "2026-10-18T09:30:00Z"]) {
        assert.throws(() => common.validateDateTime(value), { status: 400 });
    }
});

test("Validadores: decimales exactos y URLs de imagen mantienen su contrato", () => {
    assert.equal(common.validateDecimal("00012.30", "monto", 12, 2), "00012.30");
    for (const value of [true, "1e2", "-1", "1.234"]) {
        assert.throws(() => common.validateDecimal(value, "monto", 12, 2), { status: 400 });
    }
    assert.equal(common.validateImagenUrl("  https://example.com/a.png  "), "https://example.com/a.png");
    assert.equal(common.validateImagenUrl(" "), null);
    for (const value of ["inválida", "ftp://example.com/a.png", "https://user:pass@example.com/a.png"]) {
        assert.throws(() => common.validateImagenUrl(value), {
            status: 400,
            message: "imagen_url debe ser una URL HTTP o HTTPS válida"
        });
    }
});

test("Validadores: filtros conservan las diferencias de paginación de cada módulo", () => {
    const inventario = require("../src/utils/validators/inventario.validators");
    const gastos = require("../src/utils/validators/gasto.validators");
    assert.equal(inventario.validateFiltros({ offset: 1 }).offset, 1);
    assert.throws(() => gastos.validateFiltros({ offset: 1 }), { status: 400 });
    for (const validator of [inventario, gastos]) {
        assert.equal(validator.validateFiltros({ offset: "1" }).offset, 1);
        assert.equal(validator.validateFiltros({}).limit, 50);
        assert.throws(() => validator.validateFiltros({ limit: "201" }), { status: 400 });
    }
});
