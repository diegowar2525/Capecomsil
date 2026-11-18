const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
const pool = require('../src/config/database');
const { createAuthenticatedFetch } = require('./helpers/authenticated-fetch');

test('Empresas y facturación agrupada: migración, cobros, restricciones y concurrencia', async () => {
    const admin = await pool.connect();
    const schemaName = 'empresas_test_' + process.pid;
    const isolated = new Pool({ ...pool.options, password: pool.options.password, options: '-c search_path=' + schemaName + ',public' });
    const originalQuery = pool.query;
    const originalConnect = pool.connect;
    let server;
    try {
        await admin.query(`CREATE SCHEMA ${schemaName}`);
        await admin.query(`SET search_path TO ${schemaName},public`);
        const schema = fs.readFileSync(path.join(__dirname,'../../database/schema.sql'),'utf8');
        await admin.query(schema.split('-- Empresas y facturación agrupada (041).')[0]);
        await admin.query(`INSERT INTO gasolinera(nombre,ruc) VALUES ('Estación A','0991234567001'),('Estación B','0991234567001'),('Otra','0991234567002');
            ALTER TABLE liquidacion DISABLE TRIGGER USER;
            INSERT INTO liquidacion(id_gasolinera,periodo_inicio,periodo_fin,estado,fecha_envio,fecha_confirmacion,valor_transporte,retencion,total_liquidacion)
            VALUES (1,'2026-01-01','2026-01-31','CONFIRMADA',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,100,1,99),
                   (2,'2026-01-01','2026-01-31','CONFIRMADA',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,200,2,198),
                   (3,'2026-01-01','2026-01-31','CONFIRMADA',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,50,0,50),
                   (1,'2025-12-01','2025-12-31','CONFIRMADA',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,10,0,10);
            ALTER TABLE liquidacion ENABLE TRIGGER USER;
            INSERT INTO factura(id_liquidacion,numero_factura,fecha_emision,subtotal,retencion,valor_neto) VALUES (4,'ANTERIOR','2025-12-31',10,0,10);`);
        await admin.query(fs.readFileSync(path.join(__dirname,'../../database/migrations/041_empresas_facturacion_agrupada.sql'),'utf8'));
        await admin.query(fs.readFileSync(path.join(__dirname,'../../database/migrations/042_documentos_historicos.sql'),'utf8'));
        const empresa = (await admin.query("SELECT id_empresa FROM empresa WHERE ruc='0991234567001'")).rows[0].id_empresa;
        assert.equal((await admin.query('SELECT count(*) FROM empresa')).rows[0].count,'2');
        assert.equal((await admin.query('SELECT id_liquidacion FROM factura_liquidacion WHERE id_factura=1')).rows[0].id_liquidacion,4);
        pool.query = isolated.query.bind(isolated);
        pool.connect = isolated.connect.bind(isolated);
        const auth = await createAuthenticatedFetch(isolated,'OPERADOR');
        server = require('../src/app').listen(0,'127.0.0.1');
        await new Promise(resolve => server.once('listening',resolve));
        const base = `http://127.0.0.1:${server.address().port}/api`;
        const request = async (url, method='GET', data) => {
            const response = await auth(base+url,{method,headers:{'Content-Type':'application/json'},body:data ? JSON.stringify(data) : undefined});
            return {status:response.status,body:await response.json()};
        };
        const nueva = await request('/empresas','POST',{nombre:'Nueva empresa',ruc:'0991234567003'});
        assert.equal(nueva.status,201);
        assert.equal((await request('/empresas','POST',{nombre:'Duplicada',ruc:'0991234567003'})).status,409);
        const gas = await request('/gasolineras','POST',{nombre:'Nueva estación',id_empresa:nueva.body.id_empresa});
        assert.equal(gas.status,201);
        assert.equal((await request('/gasolineras/'+gas.body.id_gasolinera)).body.nombre_empresa,'Nueva empresa');
        assert.equal((await request('/empresas/'+nueva.body.id_empresa,'DELETE')).status,409);
        const data = {id_empresa:empresa,id_liquidaciones:[1,2],numero_factura:'AGRUPADA',fecha_emision:'2026-02-01'};
        assert.equal((await request('/facturas-cliente','POST',{...data,id_liquidaciones:[1,3]})).status,409);
        const factura = await request('/facturas-cliente','POST',data);
        assert.equal(factura.status,201,JSON.stringify(factura.body));
        const id = factura.body.id_factura;
        assert.equal(factura.body.valor_neto,'297.00');
        assert.deepEqual(factura.body.id_liquidaciones,[1,2]);
        const detalle = await request('/facturas-cliente/'+id);
        assert.equal(detalle.body.liquidaciones.length,2);
        assert.equal((await request('/facturas-cliente','POST',{...data,numero_factura:'DUP'})).status,409);
        assert.equal((await request('/facturas-cliente?id_empresa='+empresa)).body.length,2);
        const pago = await request('/cobros-cliente','POST',{id_factura:id,fecha_pago:'2026-02-02',monto:'97',forma_pago:'EFECTIVO'});
        assert.equal(pago.status,201,JSON.stringify(pago.body));
        assert.equal((await request('/facturas-cliente/'+id)).body.saldo,'200.00');
        assert.equal((await request('/cobros-cliente?id_empresa='+empresa)).body.length,1);
        assert.equal((await request('/facturas-cliente/'+id+'/anular','POST',{motivo:'Corrección'})).status,409);
        assert.equal((await request('/liquidaciones/1/anular','POST',{version:1,motivo:'Corrección'})).status,409);
        await request('/cobros-cliente/'+pago.body.id_pago+'/anular','POST',{motivo:'Corrección'});
        assert.equal((await request('/facturas-cliente/'+id+'/anular','POST',{motivo:'Corrección'})).status,200);
        assert.equal((await admin.query('SELECT count(*) FROM factura_liquidacion WHERE id_factura=$1 AND vigente',[id])).rows[0].count,'0');
        const results = await Promise.all(['R1','R2'].map(numero_factura => request('/facturas-cliente','POST',{...data,numero_factura})));
        assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);
        const resumen = await require('../src/models/resumen.model').cuentasPorCobrar();
        assert.equal(Number(resumen.total_pendiente),307);
        assert.equal(resumen.clientes.length,1);
        assert.equal(resumen.clientes[0].id_empresa,empresa);
        await assert.rejects(admin.query('UPDATE gasolinera SET id_empresa=$1 WHERE id_gasolinera=1',[nueva.body.id_empresa]), {constraint:'gasolinera_empresa_facturada'});
    } finally {
        pool.query = originalQuery;
        pool.connect = originalConnect;
        if (server) await new Promise(resolve=>server.close(resolve));
        await isolated.end();
        await admin.query('ROLLBACK');
        await admin.query('SET search_path TO public');
        await admin.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
        admin.release();
        await pool.end();
    }
});
