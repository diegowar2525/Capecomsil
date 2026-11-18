const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pool = require('../src/config/database');
const { createEnTransaccion } = require('../src/services/documentos_historicos.service');
const { validateData } = require('../src/utils/validators/documento_historico.validators');
const data = { id_empresa:1,id_proveedor:1,numero_factura:'133',fecha_emision:'2025-12-15',fecha_corte:'2026-01-01',
    archivo_origen:'ENERO -2026-new.xlsm',hoja_origen:'FACTURAS',fila_origen:12,huella_origen:'a'.repeat(64),
    total:'805.00',importe_pagado_previo:'268.33',retencion:'0' };
test('Validación histórica', () => {
    assert.equal(Number(validateData(data,'CLIENTE').importe_pagado_previo),268.33);
    for (const cambio of [{total:undefined},{importe_pagado_previo:900},{fila_origen:0},{huella_origen:'invalida'},
        {fecha_corte:'2025-01-01'},{estado:'ANULADA',motivo_anulacion:'Anterior'}]) {
        assert.throws(()=>validateData({...data,...cambio},'CLIENTE'),{status:400});
    }
});
test('Históricos: saldos previos, caja y origen único sin detalles ficticios', async () => {
    const c = await pool.connect();
    const schema = 'historicos_test_'+process.pid;
    try {
        await c.query(`CREATE SCHEMA ${schema}; SET search_path TO ${schema},public`);
        await c.query(fs.readFileSync(path.join(__dirname,'../../database/schema.sql'),'utf8'));
        await c.query("INSERT INTO empresa(nombre,ruc) VALUES('MAXFUEL','0991234567001'); INSERT INTO proveedor(nombre) VALUES('Durallanta')");
        const f = await createEnTransaccion(c,'CLIENTE',data);
        const fp = await createEnTransaccion(c,'PROVEEDOR',data);
        assert.equal(fp.subtotal,null);
        assert.equal((await c.query('SELECT count(*) FROM factura_liquidacion')).rows[0].count,'0');
        await assert.rejects(createEnTransaccion(c,'CLIENTE',{...data,numero_factura:'OTRA'}),{code:'23505'});
        const fm = require('../src/models/factura_cliente.model');
        assert.equal((await fm.findById(f.id_factura,c)).saldo,'536.67');
        await c.query("INSERT INTO pago(id_factura,fecha_pago,monto,forma_pago) VALUES($1,'2026-01-15',268.33,'EFECTIVO')",[f.id_factura]);
        await c.query("INSERT INTO pago_proveedor(id_factura_proveedor,fecha_pago,monto,forma_pago) VALUES($1,'2026-01-15',268.33,'EFECTIVO')",[fp.id_factura_proveedor]);
        assert.equal((await fm.findById(f.id_factura,c)).saldo,'268.34');
        const proveedor = await require('../src/models/factura_proveedor.model').findById(fp.id_factura_proveedor,c);
        assert.equal(proveedor.saldo_pendiente,'268.34');
        assert.equal(proveedor.detalles.length,0);
        await assert.rejects(c.query("INSERT INTO pago(id_factura,fecha_pago,monto,forma_pago) VALUES($1,'2026-01-16',300,'EFECTIVO')",[f.id_factura]),{code:'23514'});
        await assert.rejects(c.query("INSERT INTO pago_proveedor(id_factura_proveedor,fecha_pago,monto,forma_pago) VALUES($1,'2025-12-20',10,'EFECTIVO')",[fp.id_factura_proveedor]),{code:'23514'});
        await assert.rejects(c.query('UPDATE factura_proveedor SET total=900 WHERE id_factura_proveedor=$1',[fp.id_factura_proveedor]),{code:'23514'});
        await assert.rejects(c.query("INSERT INTO pago_proveedor(id_factura_proveedor,fecha_pago,monto,forma_pago) VALUES($1,'2026-01-16',300,'EFECTIVO')",[fp.id_factura_proveedor]),{code:'23514'});
        await assert.rejects(c.query("INSERT INTO pago(id_factura,fecha_pago,monto,forma_pago) VALUES($1,'2025-12-20',10,'EFECTIVO')",[f.id_factura]),{code:'23514'});
        await assert.rejects(c.query("UPDATE factura SET estado='ANULADA',fecha_anulacion=now(),motivo_anulacion='Prueba' WHERE id_factura=$1",[f.id_factura]),{code:'23514'});
        const rm = require('../src/models/resumen.model');
        const cuentas = await rm.cuentasPorCobrar(c);
        assert.equal(Number(cuentas.total_pendiente),268.34);
        assert.equal(cuentas.clientes[0].empresa,'MAXFUEL');
        assert.equal(cuentas.clientes[0].facturas[0].cobros.length,1);
        assert.equal(cuentas.clientes[0].facturas[0].liquidaciones.length,0);
        const mensual = await rm.mensual({fecha_desde:'2026-01-01',fecha_hasta:'2026-01-31'},c);
        assert.equal(Number(mensual.cobros),268.33);
        assert.equal(Number(mensual.pagos_proveedores),268.33);
        assert.equal(Number(mensual.ingresos_viajes),0);
        const anulada = await createEnTransaccion(c,'CLIENTE',{...data,numero_factura:'128',fila_origen:13,estado:'ANULADA',motivo_anulacion:'Anulada en origen',importe_pagado_previo:0});
        assert.equal(anulada.fecha_anulacion,null);
        assert.equal(Number((await rm.cuentasPorCobrar(c)).total_pendiente),268.34);
    } finally {
        await c.query('ROLLBACK');
        await c.query('SET search_path TO public');
        await c.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
        c.release();
        await pool.end();
    }
});
