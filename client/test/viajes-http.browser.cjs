const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
 const { createServer } = await import('vite');
 const server = await createServer({ server: { port: 0, host: '127.0.0.1', hmr: false } });
 await server.listen(); let browser;
 try {
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true }));
  await page.route('**/api/**', route => {
   const path = new URL(route.request().url()).pathname;
   const data = path === '/api/auth/me' ? { usuario: { id_usuario: 1, nombre: 'Prueba', rol: 'JEFE', activo: true }, permisos: ['viajes.consultar','viajes.crear'], fecha_expiracion: '2099-01-01' }
    : path === '/api/terminales' ? [{ id_terminal: 1, nombre: 'Terminal', estado: true }] : [];
   return route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
  });
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/#/viajes`);
  await page.getByRole('button', { name: /Registrar viaje/ }).click();
  await page.getByRole('button', { name: 'Agregar entrega', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Agregar producto', exact: true }).count(), 2);
  await page.getByRole('button', { name: 'Agregar producto', exact: true }).first().click();
  assert.deepEqual(errors, []);
  console.log('Viaje móvil sin randomUUID: apertura, entregas y productos correctos');
 } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
