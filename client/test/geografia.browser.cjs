const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
    const { createServer } = await import('vite');
    const server = await createServer({ server: { port: 0, host: '127.0.0.1', open: false, hmr: false } });
    await server.listen();
    let browser;
    try {
        browser = await chromium.launch({ channel: 'msedge', headless: true });
        const page = await browser.newPage();
        const errors = [], mutations = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/api/**', async route => {
            const req = route.request(), path = new URL(req.url()).pathname;
            const json = data => route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
            if (path === '/api/auth/me') return json({usuario:{id_usuario:1,nombre:'Prueba',rol:'JEFE',activo:true},permisos:['catalogos.consultar','catalogos.crear','catalogos.editar','catalogos.eliminar'],fecha_expiracion:'2099-01-01'});
            if(req.method() !== 'GET') {mutations.push(req.postDataJSON()); return json({id_terminal:1,...req.postDataJSON()});}
            if(path === '/api/provincias') return json([{id_provincia:1,nombre:'Azuay',estado:true},{id_provincia:2,nombre:'Loja',estado:true}]);
            if(path === '/api/ciudades') return json([{id_ciudad:1,id_provincia:1,nombre:'Cuenca',estado:true},{id_ciudad:2,id_provincia:2,nombre:'Loja',estado:true}]);
            if(path === '/api/terminales/1') return json({id_terminal:1,nombre:'Terminal',ubicacion:'Dirección',id_ciudad:1,id_provincia:1,estado:true});
            if(path === '/api/terminales') return json([{id_terminal:1,nombre:'Terminal',ubicacion:'Dirección',id_ciudad:1,id_provincia:1,ciudad:'Cuenca',provincia:'Azuay',estado:true}]);
            return json([]);
        });
        await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/#/terminales`);
        await page.getByRole('button',{name:'Nueva Terminal',exact:false}).click();
        await page.getByLabel('Provincia (opcional)',{exact:true}).selectOption('1');
        const city = page.getByLabel('Ciudad (opcional)',{exact:true});
        assert.equal(await city.locator('option').count(),2);
        await city.selectOption('1');
        await page.getByLabel('Provincia (opcional)',{exact:true}).selectOption('2');
        assert.equal(await city.inputValue(),'');
        assert.equal(await city.locator('option').last().textContent(),'Loja');
        await city.selectOption('2');
        await page.getByLabel('Terminal',{exact:true}).fill('Nuevo');
        await page.getByLabel('Ubicación',{exact:true}).fill('Dirección');
        await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();
        await page.getByRole('dialog').waitFor({state:'hidden'});
        assert.equal(mutations[0].id_ciudad,'2');
        assert.equal('id_provincia' in mutations[0],false);
        await page.getByRole('button',{name:'Editar',exact:true}).click();
        assert.equal(await page.getByLabel('Provincia (opcional)',{exact:true}).inputValue(),'1');
        assert.equal(await page.getByLabel('Ciudad (opcional)',{exact:true}).inputValue(),'1');
        await page.setViewportSize({width:390,height:844});
        const box = await page.getByRole('dialog').boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= 390);
        assert.deepEqual(errors,[]);
        console.log('Geografía: selección dependiente, guardado, edición y móvil correctos');
    } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
