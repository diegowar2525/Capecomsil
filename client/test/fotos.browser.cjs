// Ejecutar con node test/fotos.browser.cjs. Requiere Playwright y Edge instalado.
// PLAYWRIGHT_MODULE permite usar una instalación externa sin añadir dependencias al proyecto.
// Todas las peticiones API se interceptan; nunca accede a PostgreSQL ni R2.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
    const { createServer } = await import('vite');
    const server = await createServer({ server: { port: 0, host: '127.0.0.1', open: false } });
    await server.listen();
    let browser;
    try {
        browser = await chromium.launch({ channel: 'msedge', headless: true });
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        const base = `http://127.0.0.1:${server.httpServer.address().port}`;
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const calls = [];
        let failPhoto = false;
        let version = 0;
        const usuario = { id_usuario: 1, nombre: 'Usuario de prueba', nombre_usuario: 'prueba', correo: '', rol: 'JEFE', activo: true, requiere_cambio_password: false, imagen_url: null };
        const records = {
            choferes: [{ id_chofer: 1, nombre: 'Chofer de prueba', cedula: '0101234567', tipo_remuneracion: 'DIARIO_FIJO', estado: true }],
            vehiculos: [{ id_vehiculo: 1, placa: 'TEST-001', marca: 'Test', modelo: 'Test', anio: 2025, capacidad_galones: 4000, estado: true }],
            productos: [{ id_producto: 1, id_categoria: 1, nombre_categoria: 'Filtros', nombre: 'Filtro', unidad_medida: 'unidad', stock_minimo: '0', estado: true }],
            'categorias-producto': [{ id_categoria: 1, nombre: 'Filtros', estado: true, es_llanta: false }]
        };
        const keys = { choferes: 'id_chofer', vehiculos: 'id_vehiculo', productos: 'id_producto' };
        const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII=', 'base64');
        const file = { name: 'foto.png', mimeType: 'image/png', buffer: png };
        await page.route('**/api/**', async route => {
            const req = route.request();
            const path = new URL(req.url()).pathname;
            const method = req.method();
            calls.push({ path, method });
            const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
            if ((path.startsWith('/api/fotos/') || path.startsWith('/api/auth/fotos/')) && method === 'GET') {
                return route.fulfill({ contentType: 'image/png', body: png });
            }
            if (path === '/api/auth/me' && method === 'GET') return json({
                usuario,
                permisos: ['catalogos.consultar', 'catalogos.crear', 'catalogos.editar', 'catalogos.eliminar'], fecha_expiracion: '2099-01-01'
            });
            if (path === '/api/auth/me' && method === 'PATCH') return json(Object.assign(usuario, req.postDataJSON()));
            const photo = path.match(/^\/api\/fotos\/(choferes|vehiculos|productos)\/(\d+)$/);
            if (photo || path === '/api/auth/me/foto') {
                if (method === 'PUT') {
                    assert.match(req.headers()['content-type'], /multipart\/form-data; boundary=/);
                    assert.equal(req.headers()['x-csrf-protection'], '1');
                    if (failPhoto) { failPhoto = false; return json({ message: 'R2 no disponible' }, 503); }
                }
                const row = photo ? records[photo[1]].find(row => row[keys[photo[1]]] === Number(photo[2])) : usuario;
                row.imagen_url = method === 'DELETE' ? null : `${base}${photo ? path : '/api/auth/fotos/1'}?v=${++version}`;
                return json(row);
            }
            const [, , resource, id] = path.split('/');
            if (!records[resource]) return json({ message: `Ruta inesperada: ${path}` }, 404);
            if (method === 'GET') return json(id ? records[resource].find(row => row[keys[resource]] === Number(id)) : records[resource]);
            const data = req.postDataJSON();
            if (method === 'POST') {
                const row = { ...data, [keys[resource]]: records[resource].length + 1 };
                records[resource].push(row);
                return json(row, 201);
            }
            if (method === 'PUT') return json(Object.assign(records[resource].find(row => row[keys[resource]] === Number(id)), data));
            return json({ message: 'Operación inesperada' }, 400);
        });
        const openEdit = async (path) => {
            await page.goto(`${base}/#/${path}`);
            await page.getByRole('button', { name: path === 'perfil' ? /Editar perfil/ : 'Editar', exact: path !== 'perfil' }).first().click();
            await page.getByLabel('Seleccionar imagen').waitFor({ state: 'attached' });
        };
        for (const path of ['perfil', 'choferes', 'vehiculos', 'productos-inventario']) {
            await openEdit(path);
            if (path === 'perfil') {
                assert.equal(await page.locator('.profile-banner').count(), 1);
                assert.equal(await page.getByRole('dialog').locator('.profile-banner').count(), 0);
                assert.equal(await page.getByLabel('Seleccionar imagen').isVisible(), false);
                const [chooser] = await Promise.all([
                    page.waitForEvent('filechooser'),
                    page.getByRole('button', { name: 'Cambiar foto de perfil', exact: true }).click()
                ]);
                assert.ok(chooser);
                if (process.env.FOTO_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.FOTO_SCREENSHOT_DIR}/perfil-modal.png` });
            }
            const before = calls.filter(call => call.method !== 'GET').length;
            await page.getByLabel('Seleccionar imagen').setInputFiles(file);
            await page.getByAltText('Vista previa de la nueva foto').waitFor();
            assert.equal(calls.filter(call => call.method !== 'GET').length, before, 'Seleccionar no debe subir');
            await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
            await page.getByText('Cambios guardados correctamente.', { exact: true }).waitFor();
            assert.equal(await page.getByLabel('Seleccionar imagen').count(), 0);
            if (path === 'perfil') assert.ok(await page.locator('img[src*="/api/auth/fotos/"]').count() >= 2, 'Perfil y sidebar deben actualizarse');
            else {
                await page.getByRole('button', { name: 'Ver detalle', exact: true }).first().click();
                await page.locator('.catalogo-detalle__cabecera').waitFor();
                if (process.env.FOTO_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.FOTO_SCREENSHOT_DIR}/detalle-${path}.png` });
                await page.setViewportSize({ width: 390, height: 844 });
                assert.equal(await page.locator('.catalogo-detalle').evaluate(el => el.scrollWidth > el.clientWidth), false);
                if (process.env.FOTO_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.FOTO_SCREENSHOT_DIR}/detalle-${path}-movil.png` });
                await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
                await page.setViewportSize({ width: 1280, height: 900 });
            }
        }
        await openEdit('perfil');
        const beforeCancel = calls.filter(call => call.method !== 'GET').length;
        await page.getByLabel('Seleccionar imagen').setInputFiles(file);
        await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
        assert.equal(calls.filter(call => call.method !== 'GET').length, beforeCancel);
        await openEdit('perfil');
        await page.getByRole('button', { name: 'Quitar foto', exact: true }).click();
        await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
        await page.getByText('Cambios guardados correctamente.', { exact: true }).waitFor();
        assert.equal(usuario.imagen_url, null);
        assert.equal(await page.locator('img[src*="/api/auth/fotos/"]').count(), 0);

        // Crear y reintentar una foto fallida no duplica el registro.
        await page.goto(`${base}/#/choferes`);
        await page.getByRole('button', { name: /Nuevo Chofer/ }).click();
        await page.locator('[name="nombre"]').fill('Nuevo chofer');
        await page.locator('[name="cedula"]').fill('0109876543');
        await page.locator('[name="tipo_remuneracion"]').selectOption('DIARIO_FIJO');
        await page.getByLabel('Seleccionar imagen').setInputFiles(file);
        failPhoto = true;
        await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
        await page.getByRole('alert').filter({ hasText: 'Los datos se guardaron' }).waitFor();
        await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
        await page.getByText('Cambios guardados correctamente.', { exact: true }).waitFor();
        assert.equal(calls.filter(call => call.path === '/api/choferes' && call.method === 'POST').length, 1);
        assert.equal(records.choferes.length, 2);

        // El selector y su vista previa caben en un teléfono.
        await page.setViewportSize({ width: 390, height: 844 });
        await openEdit('perfil');
        await page.getByLabel('Seleccionar imagen').setInputFiles(file);
        await page.getByAltText('Vista previa de la nueva foto').waitFor();
        const box = await page.locator('.foto-selector').boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= 390);
        const overflow = await page.locator('.foto-selector').evaluate(el => el.scrollWidth > el.clientWidth);
        assert.equal(overflow, false);
        if (process.env.FOTO_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.FOTO_SCREENSHOT_DIR}/perfil-modal-movil.png` });
        assert.deepEqual(errors, []);
        console.log('Fotos navegador: cuatro módulos, avatar, cancelación, eliminación, reintento sin duplicados y ancho de 390px aprobados.');
    } finally {
        await browser?.close();
        await server.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
