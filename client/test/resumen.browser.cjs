const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
    const { createServer } = await import('vite');
    const server = await createServer({ server: { host: '127.0.0.1', port: 0, hmr: false } });
    await server.listen();
    let browser;
    try {
        browser = await chromium.launch({ channel: 'msedge', headless: true });
        const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
        const errors = [];
        let monthlyFailure = false;
        page.on('pageerror', error => errors.push(error.message));
        const monthly = {
            galones: '10000', produccion: [{id_gasolinera:1,gasolinera:'Cecilia',viajes:6,entregas:8,galones:'10000',ingresos:'12000'}], proveedores: [{proveedor:'Taller',importe:'1000'}], cantidad_viajes: 6, ingresos_viajes: '12000.00', total_costos: '4750.00', resultado: '7250.00',
            cobros: '8000.00', gastos_pagados: '2200.00', pagos_proveedores: '1000.00', desembolsos: '3200.00', flujo_registrado: '4800.00',
            choferes_sin_fecha: 0, dias_pendientes: 0, remuneraciones_hasta: '2026-11-04', generado_en: '2026-11-05T11:30:00',
            conceptos: ['Viáticos desembolsados', 'Remuneraciones calculadas', 'Combustible registrado', 'Peajes registrados', 'Otros gastos operativos', 'Mantenimientos y reparaciones'].map((concepto, i) => ({ concepto, importe: ['120', '2000', '1500', '130', '100', '900'][i] }))
        };
        const invoices = Array.from({ length: 48 }, (_, i) => ({ id_factura: i + 1, numero_factura: `001-001-${String(i + 1).padStart(9, '0')}`, fecha_emision: '2026-10-01', fecha_vencimiento: '2026-10-31', valor_neto: '1000.00', cobrado: '200.00', saldo: '800.00', vencida: true }));
        const cuentas = { total_pendiente: '38400.00', total_vencido: '38400.00', cantidad_facturas: 48, cantidad_clientes: 1, generado_en: monthly.generado_en, clientes: [{ id_gasolinera: 1, gasolinera: 'Estación de servicio Cecilia', cantidad_facturas: 48, saldo: '38400.00', vencido: '38400.00', cobrado: '9600.00', facturas: invoices }] };
        await page.route('**/api/**', async route => {
            const url = new URL(route.request().url());
            const json = data => route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
            if (url.pathname === '/api/auth/me') return json({ usuario: { id_usuario: 1, nombre: 'Usuario de prueba', rol: 'JEFE', activo: true }, permisos: ['informes.consultar', 'catalogos.consultar', 'remuneraciones.consultar'], fecha_expiracion: '2099-01-01' });
            if (url.pathname.endsWith('/resumen-mensual')) {
                if (monthlyFailure) return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Error de prueba recuperable' }) });
                return json(monthly);
            }
            if (url.pathname.endsWith('/cuentas-por-cobrar')) return json(cuentas);
            if (url.pathname === '/api/vehiculos') return json([{ id_vehiculo: 1, placa: 'ABC-1234' }]);
            if (url.pathname === '/api/terminales') return json([{id_terminal:1,nombre:'La Troncal'}]);
            if (url.pathname === '/api/informes/produccion') return json([{id_vehiculo:1,placa:'ABC-1234',viajes:1,entregas:2,galones:'300',ingresos:'30.00',costo_estimado:'5.00',margen_estimado:'25.00',participacion:'100',gasolineras:'Cecilia · Mechita',terminales:[{id_terminal:1,terminal:'La Troncal',ingresos:'30.00'}]}]);
            if (url.pathname === '/api/remuneraciones-chofer/cobertura') return json({choferes_sin_fecha:0,dias_pendientes:0,hasta_procesable:'2026-11-05'});
            if (url.pathname === '/api/remuneraciones-chofer') {
                assert.equal(url.searchParams.has('id_chofer'),false);
                return json([{id_remuneracion_chofer:1,id_chofer:1,nombre_chofer:'Chofer de prueba',fecha:'2026-10-01',total:'30.00',costo_asignado:'0.00',costo_sin_asignar:'30.00'}]);
            }
            if (url.pathname === '/api/choferes') return json([{ id_chofer: 1, nombre: 'Chofer de prueba' }]);
            if (url.pathname === '/api/informes/viajes') return json([{ id_viaje: 1, placa: 'ABC-1234', fecha_inicio: '2026-10-05T08:00:00', ingreso_transporte: '80.00', costo_estimado_total: '12.00', margen_estimado: '68.00' }]);
            return json([]);
        });
        const base = `http://127.0.0.1:${server.httpServer.address().port}`;
        await page.goto(base + '/#/resumen');
        await page.locator('.resumen-page .resumen-kpi').first().waitFor();
        assert.equal(await page.getByRole('link', { name: 'Resumen', exact: true }).count(), 1);
        assert.equal(await page.getByRole('heading', { name: 'Resumen', exact: true }).count(), 1);
        await page.getByLabel('Mes del informe').fill('2026-10');
        await page.locator('.resumen-page .resumen-kpi').first().waitFor();
        await page.screenshot({ path: path.join(os.tmpdir(), 'capecomsil-resumen-desktop.png'), fullPage: true });
        await page.evaluate(() => { window.print = () => { window.printCalled = true; }; });
        await page.getByRole('button', { name: 'Imprimir / PDF' }).click();
        await page.waitForFunction(() => window.printCalled);
        await page.pdf({ path: path.join(os.tmpdir(), 'capecomsil-mensual.pdf'), preferCSSPageSize: true, printBackground: true });
        monthlyFailure = true;
        await page.getByRole('button', { name: 'Actualizar', exact: true }).click();
        await page.getByRole('alert').filter({ hasText: 'Error de prueba recuperable' }).waitFor();
        assert.equal(await page.getByRole('button', { name: 'Imprimir / PDF' }).isDisabled(), true);
        monthlyFailure = false;
        await page.getByRole('button', { name: 'Actualizar', exact: true }).click();
        await page.locator('.resumen-page .resumen-kpi').first().waitFor();
        await page.getByRole('button', { name: 'Cuentas por cobrar', exact: true }).click();
        await page.locator('.resumen-cliente summary').click();
        assert.equal(await page.locator('.resumen-cliente tbody tr').count(), 48);
        assert.equal(await page.getByLabel('Mes del informe').count(), 0);
        await page.pdf({ path: path.join(os.tmpdir(), 'capecomsil-cuentas.pdf'), preferCSSPageSize: true, printBackground: true });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForFunction(() => document.querySelector('#app-sidebar').getBoundingClientRect().right <= 0);
        await page.screenshot({ path: path.join(os.tmpdir(), 'capecomsil-resumen-mobile.png') });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await page.getByRole('button', { name: 'Resumen mensual', exact: true }).click();
        await page.locator('.resumen-page .resumen-kpi').first().waitFor();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await page.goto(base + '/#/consulta-viajes');
        await page.getByLabel('Desde', { exact: true }).fill('2026-10-01');
        await page.getByLabel('Hasta', { exact: true }).fill('2026-10-31');
        await page.getByRole('button', { name: 'Consultar', exact: true }).click();
        await page.getByRole('cell', { name: 'ABC-1234', exact: true }).waitFor();
        assert.equal(await page.getByRole('button', { name: 'Imprimir / PDF' }).isEnabled(), true);
        await page.pdf({ path: path.join(os.tmpdir(), 'capecomsil-viajes.pdf'), preferCSSPageSize: true, printBackground: true });
        for (const [route, title] of [['consulta-viaticos', 'Consulta de viáticos'], ['consulta-combustible', 'Consumo de combustible']]) {
            await page.goto(base + '/#/' + route);
            await page.getByRole('heading', { name: title, exact: true }).waitFor();
            await page.getByLabel('Desde', { exact: true }).fill('2026-10-01');
            await page.getByLabel('Hasta', { exact: true }).fill('2026-10-31');
            await page.getByRole('button', { name: 'Consultar', exact: true }).click();
            await page.getByRole('button', { name: 'Imprimir / PDF' }).waitFor();
            await page.waitForFunction(() => !document.querySelector('.informe-print-button').disabled);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        }
        await page.goto(base + '/#/produccion');
        await page.getByRole('heading',{name:'Producción por vehículos y terminales',exact:true}).waitFor();
        await page.getByLabel('Desde',{exact:true}).fill('2026-10-01');
        await page.getByLabel('Hasta',{exact:true}).fill('2026-10-31');
        await page.getByRole('button',{name:'Consultar',exact:true}).click();
        await page.waitForFunction(() => document.querySelector('.data-table tbody')?.textContent.includes('ABC-1234'));
        assert.equal(await page.locator('.data-table tfoot').count(),1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false);
        await page.screenshot({path:path.join(os.tmpdir(),'capecomsil-produccion-mobile.png'),fullPage:true});
        await page.pdf({path:path.join(os.tmpdir(),'capecomsil-produccion.pdf'),preferCSSPageSize:true,printBackground:true});
        for (const route of ['consulta-viajes','consulta-viaticos','consulta-combustible','produccion','remuneraciones-chofer']) {
            await page.goto(base + '/#/' + route);
            await page.getByRole('button',{name:'Consultar',exact:true}).waitFor();
            assert.equal(await page.getByText('Más filtros',{exact:true}).count(),0);
            assert.equal(await page.getByRole('button',{name:'Limpiar filtros',exact:true}).count(),0);
        }
        await page.getByLabel('Desde',{exact:true}).fill('2026-10-01');
        await page.getByLabel('Hasta',{exact:true}).fill('2026-10-31');
        await page.getByRole('button',{name:'Consultar',exact:true}).click();
        await page.getByRole('cell',{name:'Chofer de prueba',exact:true}).waitFor();
        assert.equal(await page.locator('.data-table tfoot').count(),1);
        assert.equal(await page.getByRole('alert').count(),0);
        assert.deepEqual(errors, []);
        console.log('Resumen mensual, cartera, errores/reintento, consulta, móvil e impresión verificados. PDFs en ' + os.tmpdir());
    } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
