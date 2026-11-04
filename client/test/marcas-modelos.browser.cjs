const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async()=>{
 const {createServer}=await import('vite');const server=await createServer({server:{port:0,host:'127.0.0.1',open:false,hmr:false}});await server.listen();let browser;
 try{
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();const errors=[],writes=[];page.on('pageerror',e=>errors.push(e.message));
 const marcas=[{id_marca:1,nombre:'Hino',ambito:'VEHICULO',estado:true},{id_marca:2,nombre:'Mobil',ambito:'PRODUCTO',estado:true}];const modelos=[{id_modelo:1,id_marca:1,nombre:'700',estado:true}];
 await page.route('**/api/**',async route=>{const r=route.request(),u=new URL(r.url()),p=u.pathname;const json=x=>route.fulfill({contentType:'application/json',body:JSON.stringify(x)});
 if(p==='/api/auth/me')return json({usuario:{id_usuario:1,nombre:'Prueba',rol:'JEFE',activo:true},permisos:['catalogos.consultar','catalogos.crear','catalogos.editar','catalogos.eliminar','inventario.consultar'],fecha_expiracion:'2099-01-01'});
 if(p.startsWith('/api/marcas')||p.startsWith('/api/modelos')){const brand=p.includes('/marcas'),rows=brand?marcas:modelos,key=brand?'id_marca':'id_modelo';if(r.method()==='POST'){const row={...r.postDataJSON(),[key]:rows.length+1,estado:true};rows.push(row);writes.push(row);return json(row);}if(r.method()==='PUT'){const row=rows.find(x=>x[key]===Number(p.split('/').pop()));Object.assign(row,r.postDataJSON());return json(row);}return json(rows.filter(x=>brand?x.ambito===u.searchParams.get('ambito'):marcas.some(m=>String(m.id_marca)===String(x.id_marca)&&m.ambito===u.searchParams.get('ambito'))));}
 return json([]);});
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/#/vehiculos`);await page.getByRole('button',{name:/Nuevo Vehículo/i}).click();
 await page.getByLabel('Marca seleccionada').selectOption('1');await page.getByLabel('Modelo seleccionado').selectOption('1');
 const brand=page.getByRole('group',{name:'Marca',exact:true});await brand.getByRole('textbox').fill('Isuzu');await brand.getByRole('button',{name:'Crear marca «Isuzu»'}).click();await page.getByRole('status').filter({hasText:'Catálogo actualizado'}).waitFor();assert.equal(await page.getByLabel('Modelo seleccionado').inputValue(),'');
 const model=page.getByRole('group',{name:'Modelo',exact:true});await model.getByRole('textbox').fill('FVR');await model.getByRole('button',{name:'Crear modelo «FVR»'}).click();await page.waitForFunction(()=>document.querySelector('select[id$="-select"]')!==null);await page.getByRole('button',{name:'Administrar modelo'}).click();await page.getByLabel('Nombre de modelo').fill('FVR 34');await model.getByRole('button',{name:'Guardar nombre'}).click();await page.getByRole('option',{name:'FVR 34',exact:true}).waitFor({state:'attached'});
 assert.equal(writes[1].id_marca,String(writes[0].id_marca));await page.setViewportSize({width:390,height:844});const box=await page.getByRole('dialog').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=390);
 await page.getByRole('button',{name:'Cerrar',exact:true}).click();await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/#/productos-inventario`);await page.getByRole('button',{name:/Nuevo registro/i}).click();await page.getByLabel('Marca seleccionada').selectOption('2');assert.equal(await page.getByLabel('Marca seleccionada').locator('option').count(),2);assert.deepEqual(errors,[]);console.log('Marcas/modelos: creación dependiente, edición, ámbitos y móvil correctos');
 }finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
