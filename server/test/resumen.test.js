const test = require('node:test');
const assert = require('node:assert/strict');
const { validateMes, validateCuentas } = require('../src/utils/validators/resumen.validators');

test('Resumen: meses completos, bisiestos y sin filtros silenciosos', () => {
    assert.deepEqual(validateMes({ mes: '2024-02' }), { fecha_desde: '2024-02-01', fecha_hasta: '2024-02-29' });
    assert.equal(validateMes({ mes: '2026-02' }).fecha_hasta, '2026-02-28');
    for (const query of [{}, { mes: '2026-13' }, { mes: ['2026-10'] }, { mes: '2026-10', id_vehiculo: '1' }]) assert.throws(() => validateMes(query), { status: 400 });
    assert.throws(() => validateCuentas({ mes: '2026-10' }), { status: 400 });
    validateCuentas({});
});

test('Resumen SQL: abonos, anulaciones, períodos y pagos reflejados no duplican importes', async () => {
    const pool = require('../src/config/database');
    assert.ok(['localhost', '127.0.0.1', '::1'].includes(pool.options.host), 'Solo se ejecuta en PostgreSQL local');
    const client = await pool.connect();
    try {
        // Tablas temporales en una transacción: jamás se modifican datos del usuario.
        await client.query('BEGIN');
        await client.query(`
            CREATE TEMP TABLE viaje(id_viaje int,fecha_inicio timestamp,estado text);
            CREATE TEMP TABLE detalle_viaje(id_viaje int,valor_transporte numeric(14,2));
            CREATE TEMP TABLE factura(id_factura int,id_liquidacion int,numero_factura text,fecha_emision date,fecha_vencimiento date,subtotal numeric(14,2),retencion numeric(14,2),valor_neto numeric(14,2),estado text);
            CREATE TEMP TABLE pago(id_factura int,fecha_pago date,monto numeric(14,2),estado text);
            CREATE TEMP TABLE liquidacion(id_liquidacion int,id_gasolinera int);
            CREATE TEMP TABLE gasolinera(id_gasolinera int,nombre text);
            CREATE TEMP TABLE gasto_clasificado(fecha date,estado text,origen text,tipo_gasto text,monto numeric(14,2),id_pago_proveedor int);
            CREATE TEMP TABLE mantenimiento(fecha_inicio timestamp,estado text,monto numeric(14,2));
            CREATE TEMP TABLE remuneracion_chofer(id_chofer int,fecha date,total numeric(14,2));
            CREATE TEMP TABLE chofer(id_chofer int,fecha_inicio_trabajo date,fecha_fin_trabajo date);
            CREATE TEMP TABLE factura_proveedor(id_factura_proveedor int,estado text);
            CREATE TEMP TABLE pago_proveedor(id_factura_proveedor int,fecha_pago date,monto numeric(14,2),estado text);
            INSERT INTO viaje VALUES(1,'2026-10-01','REGISTRADO'),(2,'2026-10-31 23:59:59','REGISTRADO'),(3,'2026-10-15','ANULADO'),(4,'2026-11-01','REGISTRADO');
            INSERT INTO detalle_viaje VALUES(1,1000),(1,500),(2,200),(3,999),(4,300);
            INSERT INTO gasolinera VALUES(1,'Gasolinera de prueba'),(2,'Sin deuda');
            INSERT INTO liquidacion VALUES(1,1),(2,1),(3,2),(4,2);
            INSERT INTO factura VALUES
                (1,1,'FAC-1','2026-10-01','2000-01-01',1000,100,900,'PENDIENTE'),
                (2,2,'FAC-2','2026-10-31',NULL,200,0,200,'PENDIENTE'),
                (3,3,'FAC-3','2026-10-15','2000-01-01',999,0,999,'ANULADA'),
                (4,4,'FAC-4','2026-11-01',NULL,300,0,300,'PENDIENTE');
            INSERT INTO pago VALUES(1,'2026-10-15',100,'REGISTRADO'),(1,'2026-11-01',200,'REGISTRADO'),
                (1,'2026-10-20',90,'ANULADO'),(4,'2026-11-01',300,'REGISTRADO');
            INSERT INTO gasto_clasificado VALUES
                ('2026-10-01','REGISTRADO','VIATICO','VIATICO',6,NULL),
                ('2026-11-01','REGISTRADO','VIATICO','VIATICO',20,NULL),
                ('2026-10-01','REGISTRADO','COMBUSTIBLE','COMBUSTIBLE',40,NULL),
                ('2026-10-01','REGISTRADO','OPERATIVO','PEAJE',4,NULL),
                ('2026-10-01','REGISTRADO','OPERATIVO','OPERATIVO:7',10,NULL),
                ('2026-10-01','ANULADO','OPERATIVO','PEAJE',99,NULL),
                ('2026-10-02','REGISTRADO','MANTENIMIENTO','MANTENIMIENTO',50,NULL),
                ('2026-10-02','REGISTRADO','MANTENIMIENTO','MANTENIMIENTO',30,1);
            INSERT INTO mantenimiento VALUES('2026-10-02','REGISTRADO',50),('2026-10-03','REGISTRADO',100),('2026-10-04','ANULADO',99);
            INSERT INTO remuneracion_chofer VALUES(1,'2026-10-01',30),(1,'2026-10-02',30),(1,'2026-11-01',30);
            INSERT INTO chofer VALUES(1,'2026-10-01','2026-10-03'),(2,NULL,NULL);
            INSERT INTO factura_proveedor VALUES(1,'REGISTRADA'),(2,'REGISTRADA');
            INSERT INTO pago_proveedor VALUES(1,'2026-10-02',30,'REGISTRADO'),(2,'2026-10-03',20,'REGISTRADO'),(1,'2026-10-03',99,'ANULADO');
        `);
        await client.query(`
            ALTER TABLE detalle_viaje ADD COLUMN id_gasolinera int DEFAULT 1, ADD COLUMN galones numeric DEFAULT 10;
            ALTER TABLE gasto_clasificado ADD COLUMN nombre_tipo_gasto text DEFAULT 'Adicional';
            ALTER TABLE factura_proveedor ADD COLUMN id_proveedor int DEFAULT 1;
            CREATE TEMP TABLE proveedor(id_proveedor int,nombre text);
            INSERT INTO proveedor VALUES(1,'Taller');
        `);
        const model = require('../src/models/resumen.model');
        const data = await model.mensual(validateMes({ mes: '2026-10' }), client);
        assert.equal(data.ingresos_viajes, '1700.00');
        assert.equal(data.cantidad_viajes, 2);
        assert.equal(Number(data.galones),30);
        assert.equal(data.produccion[0].viajes,2);
        assert.equal(data.produccion[0].entregas,3);
        assert.equal(Number(data.proveedores[0].importe),50);
        assert.equal(data.total_costos, '270.00');
        assert.equal(data.resultado, '1430.00');
        assert.equal(data.cobros, '100.00');
        assert.equal(data.gastos_pagados, '110.00');
        assert.equal(data.desembolsos, '160.00'); // 30 reflejado en gasto y pago se cuenta una sola vez.
        assert.equal(data.flujo_registrado, '-60.00');
        assert.equal(data.choferes_sin_fecha, 1);
        assert.equal(data.dias_pendientes, 1);
        const cuentas = await model.cuentasPorCobrar(client);
        assert.equal(cuentas.total_pendiente, '800.00');
        assert.equal(cuentas.total_vencido, '600.00');
        assert.equal(cuentas.cantidad_clientes, 1);
        assert.equal(cuentas.cantidad_facturas, 2);
        assert.equal(cuentas.clientes[0].facturas[1].vencida, false);
        const vacio = await model.mensual(validateMes({ mes: '2025-01' }), client);
        assert.equal(Number(vacio.ingresos_viajes), 0);
        assert.equal(Number(vacio.total_costos), 0);
        assert.equal(Number(vacio.conceptos[0].importe), 0);
    } finally { await client.query('ROLLBACK'); client.release(); await pool.end(); }
});
