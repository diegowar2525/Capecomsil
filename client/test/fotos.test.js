import test from 'node:test';
import assert from 'node:assert/strict';
import { guardarConFoto } from '../src/services/guardar-con-foto.js';
import { fotoPerfilApi, fotoChoferApi, fotoVehiculoApi, fotoProductoApi } from '../src/services/fotos.api.js';
import { validarFoto } from '../src/domain/foto.js';

test('Fotos: multipart conserva cookies y CSRF sin imponer un boundary ni serializar el archivo', async t => {
    const calls = [];
    t.mock.method(globalThis, 'fetch', async (path, options) => {
        calls.push({ path, ...options });
        return Response.json({ imagen_url: 'https://example.com/foto' });
    });
    const file = new File(['foto'], 'foto.png', { type: 'image/png' });
    for (const [api, ruta] of [[fotoPerfilApi, '/api/auth/me/foto'], [fotoChoferApi, '/api/fotos/choferes/8'],
        [fotoVehiculoApi, '/api/fotos/vehiculos/8'], [fotoProductoApi, '/api/fotos/productos/8']]) {
        await api.guardar(8, file);
        const call = calls.at(-1);
        assert.equal(call.path, ruta);
        assert.equal(call.method, 'PUT');
        assert.equal(call.credentials, 'include');
        assert.equal(call.headers['X-CSRF-Protection'], '1');
        assert.equal(call.headers['Content-Type'], undefined);
        assert.ok(call.body instanceof FormData);
        assert.equal(call.body.get('foto').name, 'foto.png');
        await api.eliminar(8);
        assert.equal(calls.at(-1).method, 'DELETE');
        assert.equal(calls.at(-1).headers['Content-Type'], 'application/json');
    }
});

test('Fotos: reintentar después de un fallo de carga actualiza el ID creado, sin duplicar', async () => {
    let id;
    let attempt = 0;
    let updated;
    const ids = [];
    const args = {
        data: { nombre: 'Chofer' }, foto: { archivo: new File(['imagen'], 'foto.png', { type: 'image/png' }) },
        rowKey: 'id_chofer', guardar: async actual => { ids.push(actual); return { id_chofer: 8 }; },
        recordarRegistro: value => { id = value; }, actualizarRegistro: value => { updated = value; },
        api: { guardar: async () => { if (!attempt++) throw new Error('R2 temporalmente no disponible'); return { id_chofer: 8, imagen_url: 'https://example.com/nueva' }; } }
    };
    await assert.rejects(guardarConFoto({ ...args, id }), /Los datos se guardaron/);
    assert.equal(id, 8);
    assert.equal(updated, undefined);
    await guardarConFoto({ ...args, id });
    assert.deepEqual(ids, [undefined, 8]);
    assert.equal(updated.imagen_url, 'https://example.com/nueva');
});

test('Fotos: no sube si falla el registro o la validación; quitar usa DELETE y conservar no toca R2', async () => {
    assert.throws(() => validarFoto(new File(['x'], 'foto.svg', { type: 'image/svg+xml' })), /JPEG/);
    assert.throws(() => validarFoto({ size: 3 * 1024 * 1024 + 1, type: 'image/png' }), /3 MB/);
    let requests = 0;
    const args = { id: 2, data: {}, rowKey: 'id_usuario', recordarRegistro: () => {}, foto: { quitar: false },
        guardar: async () => ({ id_usuario: 2 }), api: { guardar: async () => { requests++; }, eliminar: async () => { requests++; return {}; } } };
    await guardarConFoto(args);
    assert.equal(requests, 0);
    await assert.rejects(guardarConFoto({ ...args, foto: { archivo: new File(['x'], 'foto.png', { type: 'image/png' }) },
        guardar: async () => { throw new Error('Datos incorrectos'); } }), /Datos incorrectos/);
    assert.equal(requests, 0);
    await guardarConFoto({ ...args, foto: { quitar: true } });
    assert.equal(requests, 1);
});
