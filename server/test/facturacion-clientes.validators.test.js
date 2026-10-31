const { test } = require("node:test");
const assert = require("node:assert/strict");
const factura = require("../src/utils/validators/factura_cliente.validators");
const cobro = require("../src/utils/validators/cobro_cliente.validators");
test("Facturación externa: fechas, importes inmutables y filtros estrictos", () => {
    const data = { id_liquidacion: 1, numero_factura: " 001-001-00001 ", fecha_emision: "2026-10-01" };
    assert.equal(factura.validateData(data).numero_factura, "001-001-00001");
    for (const changes of [{ numero_factura: " " }, { fecha_vencimiento: false }, { fecha_vencimiento: "2026-09-30" }, { fecha_emision: "2026-02-30" }, { subtotal: "1" }, { estado: "ANULADA" }, { id_usuario_creacion: 1 }]) {
        assert.throws(() => factura.validateData({ ...data, ...changes }), { status: 400 });
    }
    for (const query of [{ offset: [] }, { offset: "-1" }, { estado: [] }, { limit: "201" }, { estado_cobro: "OTRO" }, { desconocido: 1 }]) assert.throws(() => factura.validateFiltros(query), { status: 400 });
    assert.equal(factura.validateAnulacion({ motivo: " Corrección " }).motivo, "Corrección");
    assert.throws(() => factura.validateAnulacion({ motivo: " " }), { status: 400 });
});
test("Cobros: monto positivo preciso y comprobante para transferencia o cheque", () => {
    const data = { id_factura: 1, fecha_pago: "2026-10-01", monto: "0.01", forma_pago: "EFECTIVO" };
    assert.equal(cobro.validateData(data).monto, "0.01");
    for (const changes of [{ monto: "0" }, { monto: "-1" }, { monto: "1.001" }, { forma_pago: "OTRO-MEDIO" }, { forma_pago: "TRANSFERENCIA" }, { forma_pago: "CHEQUE" }, { saldo: "1" }]) {
        assert.throws(() => cobro.validateData({ ...data, ...changes }), { status: 400 });
    }
    assert.equal(cobro.validateData({ ...data, forma_pago: "CHEQUE", numero_comprobante: "123" }).numero_comprobante, "123");
});
