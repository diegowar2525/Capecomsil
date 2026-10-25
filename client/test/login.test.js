import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { iniciarSesion, cerrarSesion, cambiarPassword } from '../src/modules/login/services/login.api.js';

test('Login: contrato de autenticación, cookies, CSRF y credenciales incorrectas', async () => {
    const original = globalThis.fetch;
    const calls = [];
    globalThis.fetch = async (url, options) => {
        calls.push({ url, ...options });
        return { ok: true, json: async () => ({ usuario: { id_usuario: 1 } }) };
    };
    try {
        await iniciarSesion({ nombre_usuario: 'jefe', password: 'clave' });
        await cerrarSesion();
        await cambiarPassword({ password_actual: 'clave', password_nueva: 'nueva clave larga' });
        assert.deepEqual(calls.map(c => [c.url, c.method]), [
            ['/api/auth/login', 'POST'], ['/api/auth/logout', 'POST'], ['/api/auth/password', 'PATCH']
        ]);
        for (const call of calls) {
            assert.equal(call.credentials, 'include');
            assert.equal(call.headers['X-CSRF-Protection'], '1');
        }
        assert.equal(JSON.parse(calls[0].body).nombre_usuario, 'jefe');
        globalThis.fetch = async () => ({ ok: false, status: 401, json: async () => ({}) });
        await assert.rejects(iniciarSesion({}), /Usuario o contraseña incorrectos/);
    } finally { globalThis.fetch = original; }
});

test('Sesión: el panel permanece oculto hasta autenticar y cambiar contraseña temporal', async () => {
    const server = await createServer({ server: { middlewareMode: true } });
    try {
        const { SesionGate } = await server.ssrLoadModule('/src/modules/login/components/SesionGate.jsx');
        const { PerfilContext } = await server.ssrLoadModule('/src/modules/perfil/context/perfil.context.js');
        const render = (state) => renderToStaticMarkup(createElement(PerfilContext.Provider, { value: state },
            createElement(SesionGate, null, createElement('div', null, 'PANEL PRIVADO'))));
        assert.doesNotMatch(render({ loading: true }), /PANEL PRIVADO|name="password"/);
        assert.match(render({ error: 'Sin conexión' }), /Reintentar/);
        const login = render({ usuario: null });
        assert.match(login, /autoComplete="username"/i);
        assert.doesNotMatch(login, /PANEL PRIVADO|Crear cuenta/);
        assert.match(render({ usuario: { requiere_cambio_password: true } }), /Actualizar contraseña/);
        assert.doesNotMatch(render({ usuario: { requiere_cambio_password: true } }), /PANEL PRIVADO/);
        assert.match(render({ usuario: { id_usuario: 1 } }), /PANEL PRIVADO/);
    } finally { await server.close(); }
});
