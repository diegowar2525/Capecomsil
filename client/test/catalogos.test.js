import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { valoresIniciales } from '../src/domain/catalogo.js';
import { prepare as prepararTrayecto, initial } from '../src/modules/trayectos/domain/trayectos.js';
import { prepare as prepararProducto, formFields } from '../src/modules/productos-inventario/domain/productos-inventario.js';

const modulos = [
    ['choferes', 'choferes'], ['gasolineras', 'gasolineras'], ['terminales', 'terminales'],
    ['productos', 'productos-transportados'], ['proveedores', 'proveedores'], ['trayectos', 'trayectos'],
    ['categorias-producto', 'categorias-producto'], ['productos-inventario', 'productos']
];

test('Catálogos: los ocho servicios usan sus endpoints reales, sesión y CSRF', async (t) => {
    const calls = [];
    t.mock.method(globalThis, 'fetch', async (url, options) => {
        calls.push({ url, ...options });
        return { ok: true, json: async () => ({ id: 9 }) };
    });
    for (const [slug, endpoint] of modulos) {
        const { api } = await import(`../src/modules/${slug}/services/${slug}.api.js`);
        const signal = new AbortController().signal;
        await api.listar(signal);
        await api.consultar(9, signal);
        await api.crear({ nombre: 'Prueba' });
        await api.actualizar(9, { nombre: 'Editado', estado: false });
        await api.eliminar(9);
        const batch = calls.splice(0);
        assert.deepEqual(batch.map((call) => call.url), [
            `/api/${endpoint}`, `/api/${endpoint}/9`, `/api/${endpoint}`, `/api/${endpoint}/9`, `/api/${endpoint}/9`
        ]);
        assert.deepEqual(batch.map((call) => call.method), ['GET', 'GET', 'POST', 'PUT', 'DELETE']);
        assert.equal(batch[0].signal, signal);
        batch.forEach((call) => assert.equal(call.credentials, 'include'));
        batch.slice(2).forEach((call) => assert.equal(call.headers['X-CSRF-Protection'], '1'));
        assert.deepEqual(JSON.parse(batch[3].body), { nombre: 'Editado', estado: false });
    }
});

test('Catálogos: campos explícitos conservan ceros, booleanos y opcionales vacíos', async () => {
    for (const slug of ['choferes', 'gasolineras', 'terminales', 'productos', 'proveedores', 'categorias-producto']) {
        const { fields } = await import(`../src/modules/${slug}/${slug}.fields.js`);
        const { prepare } = await import(`../src/modules/${slug}/domain/${slug}.js`);
        const values = valoresIniciales(fields);
        for (const field of fields) {
            if (field.type === 'checkbox') values[field.name] = false;
            else values[field.name] = field.required ? ' prueba ' : '';
        }
        const result = prepare({ ...values, id_ajeno: 99 });
        assert.equal(result.estado, false);
        assert.equal(result.id_ajeno, undefined);
        for (const field of fields.filter((field) => !field.required && field.type !== 'checkbox')) assert.equal(result[field.name], null);
        assert.throws(() => prepare({ ...values, nombre: ' ' }), /obligatorio/);
    }
});

test('Trayectos: reconstruye tipos, descarta destinos ocultos y rechaza origen igual a destino', () => {
    const values = { ...initial({ id_terminal_origen: 1, id_gasolinera_destino: 2 }),
        nombre: ' T-G ', kilometros: '10.25', estado: false, id_gasolinera_origen: 99, id_terminal_destino: 98 };
    const result = prepararTrayecto(values);
    assert.equal(result.id_gasolinera_origen, null);
    assert.equal(result.id_terminal_destino, null);
    assert.equal(result.id_terminal_origen, '1');
    assert.equal(result.id_gasolinera_destino, '2');
    assert.equal(result.tipo_origen, undefined);
    assert.equal(result.kilometros, '10.25');
    assert.throws(() => prepararTrayecto({ ...values, tipo_destino: 'TERMINAL', id_terminal_destino: 1 }), /distintos/);
    assert.throws(() => prepararTrayecto({ ...values, id_gasolinera_destino: '' }), /obligatorio/);
});

test('Inventario: condición obligatoria solo para llantas y borrado de condición al cambiar categoría', () => {
    const catalogos = { id_categoria: [{ value: '1', es_llanta: true }, { value: '2', es_llanta: false }] };
    const values = { id_categoria: '1', nombre: 'Llanta', unidad_medida: 'unidad', stock_minimo: '0', estado: true };
    assert.throws(() => prepararProducto(values, catalogos), /condición/);
    assert.equal(prepararProducto({ ...values, condicion_llanta: 'NUEVA' }, catalogos).stock_minimo, '0');
    assert.equal(prepararProducto({ ...values, id_categoria: '2', condicion_llanta: 'NUEVA' }, catalogos).condicion_llanta, null);
    assert.ok(!formFields({ ...values, id_categoria: '2' }, catalogos).some((field) => field.name === 'condicion_llanta'));
});

test('Acciones relacionadas: carga selectores, cuentas y modalidades, y prepara cambio de modalidad', async (t) => {
    const calls = [];
    t.mock.method(globalThis, 'fetch', async (url, options) => {
        calls.push({ url, ...options });
        return { ok: true, json: async () => [{ id_terminal: 1, id_gasolinera: 2, id_categoria: 3, nombre: 'Nombre', estado: false, es_llanta: true }] };
    });
    const { api: trayectos } = await import('../src/modules/trayectos/services/trayectos.api.js');
    const { api: productos } = await import('../src/modules/productos-inventario/services/productos-inventario.api.js');
    const { api: gasolineras } = await import('../src/modules/gasolineras/services/gasolineras.api.js');
    const { api: proveedores } = await import('../src/modules/proveedores/services/proveedores.api.js');
    assert.equal((await trayectos.opciones()).id_terminal_origen[0].value, '1');
    assert.equal((await productos.opciones()).id_categoria[0].es_llanta, true);
    assert.equal((await gasolineras.relacionados('modalities', 2)).modalidades.length, 1);
    assert.equal((await proveedores.relacionados('cuentas', 9)).cuentas_por_pagar.length, 1);
    await gasolineras.ejecutar('change-modality', 2, { modalidad: 'POR_CAPACIDAD', fecha_inicio: '2026-11-01', id_gasolinera: 99 });
    assert.deepEqual(JSON.parse(calls.at(-1).body), { id_gasolinera: 2, modalidad: 'POR_CAPACIDAD', fecha_inicio: '2026-11-01' });
    assert.ok(calls.some((call) => call.url === '/api/proveedores/9/cuentas-por-pagar'));
});

test('Formularios conectados: selectores reales, campos condicionales y estados controlados', async () => {
    const server = await createServer({ server: { middlewareMode: true, watch: null, hmr: false }, appType: 'custom' });
    try {
        const { CatalogoForm } = await server.ssrLoadModule('/src/components/CatalogoConectado/CatalogoForm.jsx');
        const { fields } = await import('../src/modules/trayectos/trayectos.fields.js');
        const html = renderToStaticMarkup(createElement(CatalogoForm, {
            fields, values: { tipo_origen: 'TERMINAL', tipo_destino: 'GASOLINERA', id_terminal_origen: '1', estado: false },
            change: () => {}, saving: false, catalogos: { id_terminal_origen: [{ value: '1', label: 'Terminal real' }] }
        }));
        assert.match(html, /Terminal real/);
        assert.match(html, /name="id_gasolinera_destino"/);
        assert.doesNotMatch(html, /name="id_gasolinera_origen"/);
        assert.doesNotMatch(html, /name="id_terminal_destino"/);
        assert.doesNotMatch(html, /checked=""/);
    } finally { await server.close(); }
});
