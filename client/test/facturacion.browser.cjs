// API simulada: no accede a la base de datos ni registra documentos reales.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
    const { createServer } = await import('vite');
    const server = await createServer({ server: { port: 0, host: '127.0.0.1', open: false, hmr: false } });
    await server.listen();
    let browser;
    try {
        browser = await chromium.launch({ channel: 'msedge', headless: true });
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        const base = `http://127.0.0.1:${server.httpServer.address().port}`;
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const liquidacion = { id_liquidacion: 1, id_gasolinera: 1, nombre_gasolinera: 'Mechita', periodo_inicio: '2026-10-01', periodo_fin: '2026-10-30', total_liquidacion: '100.00', estado: 'CONFIRMADA', version: 3, detalles: [] };
        let factura;
        let entregasDisponibles = [];
        const cobros = [];
        const mutations = [];
        await page.route('**/api/**', async route => {
            const req = route.request();
            const url = new URL(req.url());
            const path = url.pathname;
            const json = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
            if (path === '/api/auth/me') return json({ usuario: { id_usuario: 1, nombre: 'Operador', nombre_usuario: 'operador', rol: 'OPERADOR', activo: true, requiere_cambio_password: false }, permisos: ['liquidaciones','facturas_cliente','cobros_cliente'].flatMap(mod => ['consultar','crear','anular'].map(action => `${mod}.${action}`)), fecha_expiracion: '2099-01-01' });
            if (req.method() === 'GET') {
                if (path === '/api/liquidaciones/entregas-disponibles') return json({ cantidad: entregasDisponibles.length, total_galones: '100.00', valor_transporte: '12.00', entregas: entregasDisponibles });
                if (path === '/api/gasolineras') return json([{ id_gasolinera: 1, nombre: 'Mechita' }]);
                if (path.startsWith('/api/liquidaciones')) return json(path.endsWith('/1') ? liquidacion : [liquidacion]);
                if (path.startsWith('/api/facturas-cliente')) return json(path.endsWith('/1') ? { ...factura, cobros, entregas: [] } : factura ? [factura] : []);
                if (path.startsWith('/api/cobros-cliente')) return json(path.endsWith('/1') ? cobros[0] : cobros);
            }
            assert.equal(req.headers()['x-csrf-protection'], '1');
            const data = req.postDataJSON();
            mutations.push({ path, data });
            if (path === '/api/facturas-cliente') {
                assert.equal(data.id_liquidacion, 1);
                assert.equal(data.version, undefined);
                factura = { ...data, id_factura: 1, id_gasolinera: 1, nombre_gasolinera: 'Mechita', estado: 'REGISTRADA', valor_neto: '100.00', subtotal: '100.00', retencion: '0.00', saldo: '100.00', total_cobrado: '0.00', estado_cobro: 'PENDIENTE' };
                return json(factura, 201);
            }
            if (path === '/api/cobros-cliente') {
                assert.equal(data.id_factura, 1);
                cobros.push({ ...data, id_pago: 1, numero_factura: factura.numero_factura, nombre_gasolinera: 'Mechita', estado: 'REGISTRADO' });
                Object.assign(factura, { saldo: '75.00', total_cobrado: '25.00', estado_cobro: 'PARCIAL' });
                return json(cobros[0], 201);
            }
            if (path === '/api/cobros-cliente/1/anular') {
                Object.assign(cobros[0], { estado: 'ANULADO', motivo_anulacion: data.motivo });
                return json(cobros[0]);
            }
            return json({ message: `Ruta inesperada ${path}` }, 404);
        });
        await page.goto(`${base}/#/liquidaciones`);
        await page.getByRole('button', { name: /Crear borrador/ }).click();
        await page.getByLabel('Gasolinera', { exact: true }).selectOption('1');
        await page.getByLabel('Inicio del período').fill('2026-10-01');
        await page.getByLabel('Fin del período').fill('2026-10-31');
        await page.getByLabel('Selección de entregas').selectOption('MANUAL');
        await page.getByText('No hay entregas disponibles para este período.', { exact: true }).waitFor();
        assert.equal(await page.getByRole('checkbox', { name: /Seleccionar entrega/ }).count(), 0);
        entregasDisponibles = [{ id_detalle_viaje: 7, galones: '100.00', valor_transporte: '12.00' }];
        await page.getByLabel('Fin del período').fill('2026-10-30');
        await page.getByRole('checkbox', { name: 'Seleccionar entrega 7', exact: true }).waitFor();
        await page.getByRole('checkbox', { name: 'Seleccionar entrega 7', exact: true }).check();
        await page.getByText('1 de 1 seleccionadas', { exact: true }).waitFor();
        await page.getByRole('button', { name: 'Limpiar selección', exact: true }).click();
        assert.equal(await page.getByRole('checkbox', { name: 'Seleccionar entrega 7', exact: true }).isChecked(), false);
        await page.getByRole('button', { name: 'Seleccionar todas', exact: true }).click();
        assert.equal(await page.getByRole('checkbox', { name: 'Seleccionar entrega 7', exact: true }).isChecked(), true);
        await page.setViewportSize({ width: 390, height: 844 });
        const selectorBox = await page.locator('.selector-entregas').boundingBox();
        assert.ok(selectorBox.x >= 0 && selectorBox.x + selectorBox.width <= 390);
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
        entregasDisponibles = [];
        await page.getByRole('button', { name: 'Consultar entregas disponibles', exact: true }).click();
        await page.getByLabel('Gasolinera', { exact: true }).selectOption('1');
        await page.getByLabel('Inicio del período').fill('2026-10-30');
        await page.getByLabel('Fin del período').fill('2026-10-30');
        await page.getByRole('button', { name: 'Consultar', exact: true }).click();
        await page.getByRole('dialog').getByText('No hay registros disponibles', { exact: true }).waitFor();
        entregasDisponibles = [{ id_detalle_viaje: 7, galones: '100.00', valor_transporte: '12.00' }];
        await page.getByRole('button', { name: 'Consultar', exact: true }).click();
        await page.getByRole('dialog').getByRole('cell', { name: '100.00', exact: true }).waitFor();
        await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
        await page.getByRole('button', { name: 'Ver detalle', exact: true }).click();
        await page.getByRole('button', { name: 'Registrar factura externa', exact: true }).click();
        await page.getByLabel('Número de factura', { exact: true }).fill('001-PRUEBA');
        await page.getByLabel('Fecha de emisión', { exact: true }).fill('2026-10-30');
        await page.getByRole('button', { name: 'Registrar factura externa', exact: true }).last().click();
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        await page.goto(`${base}/#/facturacion`);
        await page.getByRole('button', { name: 'Ver detalle', exact: true }).waitFor();
        await page.setViewportSize({ width: 390, height: 844 });
        const table = page.locator('.table-wrapper').first();
        assert.equal(await table.locator('th').count(), 8);
        const scroll = await table.evaluate(el => {
            el.scrollLeft = el.scrollWidth;
            return { moved: el.scrollLeft > 0, fits: el.getBoundingClientRect().right <= window.innerWidth };
        });
        assert.ok(scroll.moved && scroll.fits);
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.getByRole('button', { name: 'Ver detalle', exact: true }).click();
        await page.getByRole('heading', { name: 'Historial de cobros' }).waitFor();
        await page.getByRole('button', { name: 'Registrar cobro', exact: true }).click();
        await page.getByLabel('Fecha del cobro', { exact: true }).fill('2026-10-30');
        await page.getByLabel('Monto', { exact: true }).fill('25.00');
        await page.getByLabel('Forma de pago', { exact: true }).selectOption('EFECTIVO');
        await page.getByRole('button', { name: 'Registrar cobro', exact: true }).last().click();
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        await page.getByRole('button', { name: 'Ver detalle', exact: true }).click();
        await page.getByRole('dialog').getByText('PARCIAL', { exact: true }).waitFor();
        await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
        await page.getByRole('button', { name: /Registrar factura/, exact: false }).click();
        assert.equal(await page.getByLabel('Liquidación confirmada').locator('option[value="1"]').isDisabled(), true);
        await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
        await page.goto(`${base}/#/pagos`);
        assert.equal(await page.getByRole('button', { name: 'Editar', exact: true }).count(), 0);
        await page.getByRole('button', { name: 'Anular', exact: true }).click();
        await page.getByLabel('Motivo de anulación').fill('Error de registro');
        await page.getByRole('button', { name: 'Anular registro', exact: true }).click();
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.getByRole('button', { name: /Registrar cobro/ }).click();
        await page.getByLabel('Fecha del cobro').waitFor();
        const box = await page.getByRole('dialog').boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= 390);
        assert.deepEqual(errors, []);
        assert.equal(mutations.length, 3);
        console.log('Facturación navegador: operador, factura desde liquidación, cobro desde factura, saldo, anulación, selector y modal móvil aprobados.');
    } finally {
        await browser?.close();
        await server.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
