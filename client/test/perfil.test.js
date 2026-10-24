import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { prepararPerfil } from '../src/modules/perfil/domain/perfil.js';
import { consultarPerfil, actualizarPerfil } from '../src/modules/perfil/services/perfil.api.js';

test('Perfil: el formulario conserva solo los campos propios y permite quitar foto y correo', () => {
    assert.deepEqual(prepararPerfil({ nombre: ' Ana ', correo: ' ', imagen_url: '', id_rol: 1, activo: false }), {
        nombre: 'Ana', correo: null, imagen_url: null
    });
    for (const values of [{ nombre: '' }, { correo: 'incorrecto' }, { imagen_url: 'javascript:alert(1)' }, { imagen_url: 'https://user:secret@example.com/foto' }]) {
        assert.throws(() => prepararPerfil({ nombre: 'Ana', correo: '', imagen_url: '', ...values }));
    }
});

test('Perfil API: consulta sesión, envía cookies y CSRF, informa sesión vencida', async (t) => {
    const calls = [];
    const usuario = { id_usuario: 1, nombre: 'Ana', rol: 'OPERADOR' };
    const mock = t.mock.method(globalThis, 'fetch', async (url, options) => {
        calls.push({ url, options });
        return { ok: true, json: async () => options.method === 'GET' ? { usuario } : usuario };
    });
    assert.deepEqual(await consultarPerfil(), usuario);
    const data = { nombre: 'Ana', correo: null, imagen_url: null };
    assert.deepEqual(await actualizarPerfil(data), usuario);
    assert.equal(calls[0].url, '/api/auth/me');
    assert.equal(calls[0].options.credentials, 'include');
    assert.equal(calls[1].options.headers['X-CSRF-Protection'], '1');
    assert.equal(calls[1].options.method, 'PATCH');
    assert.deepEqual(JSON.parse(calls[1].options.body), data);
    mock.mock.mockImplementation(async () => ({ ok: false, status: 401, json: async () => ({ message: 'Sesión vencida' }) }));
    await assert.rejects(consultarPerfil(), { status: 401 });
});

test('Sidebar y página muestran identidad real y solo edición de perfil', async () => {
    const server = await createServer({ server: { middlewareMode: true, watch: null, hmr: false }, appType: 'custom' });
    try {
        const { PerfilContext } = await server.ssrLoadModule('/src/modules/perfil/context/perfil.context.js');
        const { SidebarPerfil } = await server.ssrLoadModule('/src/modules/perfil/components/SidebarPerfil.jsx');
        const { PerfilPage } = await server.ssrLoadModule('/src/modules/perfil/PerfilPage.jsx');
        const usuario = { id_usuario: 1, nombre: 'Ana Pérez', nombre_usuario: 'ana.perez', correo: 'ana@example.com', rol: 'OPERADOR', imagen_url: 'https://example.com/avatar.jpg' };
        const render = (Component, value) => renderToStaticMarkup(createElement(PerfilContext.Provider, { value }, createElement(Component)));
        const value = { usuario, loading: false, error: '' };
        const sidebar = render(SidebarPerfil, value);
        assert.match(sidebar, /href="#\/perfil"/);
        assert.match(sidebar, /Ana Pérez/);
        assert.match(sidebar, /Operador/);
        assert.match(sidebar, /src="https:\/\/example.com\/avatar.jpg"/);
        assert.match(render(SidebarPerfil, { ...value, usuario: { ...usuario, imagen_url: null } }), />AP</);
        const page = render(PerfilPage, value);
        assert.match(page, /Editar perfil/);
        assert.match(page, /ana@example.com/);
        assert.doesNotMatch(page, /<table|Limpiar filtros|Orden por ID/);
        assert.doesNotMatch(page, /Desactivar|Eliminar|Administrar usuarios/);
        assert.doesNotMatch(render(PerfilPage, { ...value, usuario: { ...usuario, requiere_cambio_password: true } }), /\+ Editar perfil/);
        assert.match(render(PerfilPage, { usuario: null, loading: false, error: 'No hay sesión' }), /No hay sesión/);
    } finally { await server.close(); }
});
