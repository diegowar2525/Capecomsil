const assert = require('node:assert/strict');
(async () => {
    const { createServer } = await import('vite');
    const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
    try {
        const { CuentasContenido } = await server.ssrLoadModule('/src/modules/resumen/components/ResumenContenido.jsx');
        const React = require('react');
        const { renderToStaticMarkup } = require('react-dom/server');
        const data = { total_pendiente:90,total_vencido:90,cantidad_facturas:1,cantidad_clientes:1,
            clientes:[{id_empresa:1,empresa:'MAXFUEL',cantidad_facturas:1,saldo:90,vencido:90,cobrado:10,
                facturas:[{id_factura:133,numero_factura:'133',valor_neto:100,cobrado:10,saldo:90,
                    fecha_emision:'2025-12-31',historico:false,importe_pagado_previo:0,
                    cobros:[{fecha:'2026-01-15',importe:10,estado:'REGISTRADO',comprobante:'ABC'}],
                    liquidaciones:[{id_liquidacion:1,gasolinera:'Jipijapa',desde:'2025-12-01',hasta:'2025-12-31',total:100}]}]}] };
        for (const print of [false,true]) {
            const html = renderToStaticMarkup(React.createElement(CuentasContenido,{data,print}));
            for (const text of ['MAXFUEL','Jipijapa','ABC','Empresas con deuda','Liquidaciones por gasolinera','Total']) assert.ok(html.includes(text),text);
            if (print) assert.ok(!html.includes('<details'));
        }
        data.clientes[0].facturas[0] = {...data.clientes[0].facturas[0],historico:true,archivo_origen:'ENERO.xlsm',hoja_origen:'FACTURAS',fila_origen:12,importe_pagado_previo:10,liquidaciones:[]};
        const html = renderToStaticMarkup(React.createElement(CuentasContenido,{data,print:true}));
        assert.ok(html.includes('ENERO.xlsm'));
        assert.ok(html.includes('Pagado antes del período migrado'));
        assert.ok(!html.includes('Liquidaciones por gasolinera'));
        console.log('Resumen: pantalla e impresión, desglose y documentos históricos correctos.');
    } finally { await server.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
