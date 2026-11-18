const { test } = require('node:test');
const assert = require('node:assert/strict');
const chofer = require('../src/utils/validators/chofer.validators');
const proveedor = require('../src/utils/validators/proveedor.validators');

test('documentos ausentes o vacíos se normalizan a null; los informados se conservan', () => {
    for (const documento of [undefined, null, '', '  ']) {
        assert.equal(chofer.validateData({ nombre: 'Chofer', tipo_remuneracion: 'DIARIO_FIJO', cedula: documento }).cedula, null);
        assert.equal(proveedor.validateData({ nombre: 'Proveedor', ruc: documento }).ruc, null);
    }
    assert.equal(proveedor.validateData({ nombre: 'Proveedor', ruc: ' 00123 ' }).ruc, '00123');
    assert.throws(() => chofer.validateData({ nombre: 'Chofer', tipo_remuneracion: 'DIARIO_FIJO', cedula: 123 }));
    assert.throws(() => proveedor.validateData({ nombre: 'Proveedor', ruc: 123 }));
});
