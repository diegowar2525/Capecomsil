import test from 'node:test';
import assert from 'node:assert/strict';
import { prepararLogin, prepararPassword } from '../src/modules/login/domain/credenciales.js';
import { accionDisponible } from '../src/domain/acciones.js';
import { puedeVerRuta } from '../src/app/routePermissions.js';
import { consultarSesion } from '../src/modules/auth/services/auth.api.js';

test('Errores identifican el campo sin depender del mensaje y no envían confirmación', () => {
    assert.throws(() => prepararLogin({ nombre_usuario: '', password: 'x' }), { field: 'nombre_usuario', code: 'VALIDATION_ERROR' });
    assert.throws(() => prepararPassword({ password_actual: 'actual', password_nueva: 'nueva segura', confirmacion: 'distinta' }), { field: 'confirmacion' });
    assert.deepEqual(prepararPassword({ password_actual: 'actual', password_nueva: 'nueva segura', confirmacion: 'nueva segura' }), {
        password_actual: 'actual', password_nueva: 'nueva segura'
    });
});

test('Acciones y rutas combinan estados y permisos; anular no equivale a eliminar', () => {
    const action = { id: 'anular', permission: 'liquidaciones.anular', states: ['ENVIADA'] };
    assert.equal(accionDisponible(action, { estado: 'ENVIADA' }, ['liquidaciones.anular']), true);
    assert.equal(accionDisponible(action, { estado: 'BORRADOR' }, ['liquidaciones.anular']), false);
    assert.equal(accionDisponible(action, { estado: 'ENVIADA' }, []), false);
    assert.equal(puedeVerRuta({ path: '/liquidaciones' }, []), false);
    assert.equal(puedeVerRuta({ path: '/liquidaciones' }, ['liquidaciones.consultar']), true);
});

test('Sesión conserva permisos y rechaza respuestas incompletas', async () => {
    const original = globalThis.fetch;
    try {
        const session = { usuario: { id_usuario: 1 }, permisos: ['catalogos.consultar'], fecha_expiracion: '2026-12-01' };
        globalThis.fetch = async () => ({ ok: true, json: async () => session });
        assert.deepEqual(await consultarSesion(), session);
        globalThis.fetch = async () => ({ ok: true, json: async () => ({ usuario: { id_usuario: 1 } }) });
        await assert.rejects(consultarSesion(), /sesión válida/);
    } finally { globalThis.fetch = original; }
});
