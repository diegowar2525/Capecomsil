import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { inicializarViaje } from '../src/modules/viajes/domain/edicion.js';

test('Las rutas y formularios de la plantilla se renderizan sin autenticación ni operaciones activas', async () => {
    const server = await createServer({ server: { middlewareMode: true, watch: null }, appType: 'custom' });
    const warnings = [];
    const originalError = console.error;
    console.error = (...args) => warnings.push(args.join(' '));
    try {
        const { routes } = await server.ssrLoadModule('/src/app/routes.jsx');
        assert.equal(new Set(routes.map((route) => route.path)).size, routes.length);
        assert.ok(!routes.some((route) => /usuarios|auth|roles|permisos|cuenta/.test(route.path)));
        for (const route of routes) {
            const html = renderToStaticMarkup(createElement(route.Component));
            assert.match(html, /<h1/, route.path);
        }
        const { LiquidacionesPage } = await server.ssrLoadModule('/src/modules/liquidaciones/LiquidacionesPage.jsx');
        for (const estado of ['BORRADOR', 'ENVIADA', 'CONFIRMADA', 'ANULADA']) {
            const html = renderToStaticMarkup(createElement(LiquidacionesPage, { data: [{ id_liquidacion: 1, estado }] }));
            assert.equal(html.includes('>Anular</button>'), ['ENVIADA', 'CONFIRMADA'].includes(estado));
            assert.equal(html.includes('>Eliminar borrador</button>'), estado === 'BORRADOR');
        }
        const { TemplateForm } = await server.ssrLoadModule('/src/components/CatalogoPage/TemplateForm.jsx');
        for (const directory of await readdir('src/modules', { withFileTypes: true })) {
            if (!directory.isDirectory()) continue;
            for (const file of await readdir(`src/modules/${directory.name}`)) {
                if (!/\.(fields|actions|filters)\.js$/.test(file)) continue;
                const loaded = await server.ssrLoadModule(`/src/modules/${directory.name}/${file}`);
                const fieldSets = loaded.fields ? [loaded.fields] : loaded.filters ? [loaded.filters] : (loaded.actions ?? []).map((action) => action.fields ?? []);
                for (const fields of fieldSets) {
                    // Renderiza también cada rama condicional (recepción inicial, materiales externos, etc.).
                    const initialValues = Object.fromEntries(fields.filter((field) => field.when).map((field) => [field.when.field, field.when.value]));
                    const html = renderToStaticMarkup(createElement(TemplateForm, { fields, initialValues }));
                    assert.ok(html.includes('form-grid'));
                }
            }
        }
        assert.deepEqual(warnings, [], 'React no debe emitir advertencias por selects múltiples o atributos inválidos');
    } finally {
        console.error = originalError;
        await server.close();
    }
});

test('La plantilla de liquidaciones respeta sus transiciones y los estados de compras son femeninos', async () => {
    const { actions } = await import('../src/modules/liquidaciones/liquidaciones.actions.js');
    assert.deepEqual(actions.find((action) => action.id === 'annul').states, ['ENVIADA', 'CONFIRMADA']);
    assert.deepEqual(actions.find((action) => action.id === 'edit').states, ['BORRADOR']);
    assert.deepEqual(actions.find((action) => action.id === 'confirm').states, ['ENVIADA']);
    assert.deepEqual(actions.find((action) => action.id === 'delete').states, ['BORRADOR']);
    for (const slug of ['facturas-proveedores', 'recepciones-compra']) {
        const { actions: purchaseActions } = await import(`../src/modules/${slug}/${slug}.actions.js`);
        assert.deepEqual(purchaseActions.find((action) => action.id === 'annul').states, ['REGISTRADA']);
    }
});

test('Edición reconstruye el orden de entregas y distingue regreso opcional', () => {
    const viaje = { id_vehiculo: 1, id_chofer: 2, detalles: [
        { id_detalle_viaje: 10, id_gasolinera: 5, id_producto_transportado: 1, galones: '100' },
        { id_detalle_viaje: 11, id_gasolinera: 5, id_producto_transportado: 2, galones: '200' }
    ], tramos: [
        { id_tramo_viaje: 20, orden: 1, id_trayecto: 3, id_terminal_origen: 4, id_gasolinera_destino: 5 }
    ] };
    const initial = inicializarViaje(viaje);
    assert.equal(initial.origen, 'terminal:4');
    assert.equal(initial.paradas.length, 1);
    assert.equal(initial.paradas[0].productos.length, 2);
    assert.equal(initial.destinoFinal, '');
    viaje.tramos.unshift({ id_tramo_viaje: 21, orden: 2, id_trayecto: 4, id_gasolinera_origen: 5, id_terminal_destino: 4 });
    assert.equal(inicializarViaje(viaje).destinoFinal, 'terminal:4');
});
