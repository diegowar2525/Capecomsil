const { createAuthenticatedFetch } = require("./helpers/authenticated-fetch");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");
const { validateData } = require("../src/utils/validators/mantenimiento.validators");

const body = { id_vehiculo: 1, fecha_inicio: "2026-10-05T08:00:00", fecha_fin: "2026-10-05T12:00:00", clase: "PREVENTIVO", tipo: "Cambio de filtros", monto: "25.00", detalles: [] };

test("Mantenimiento: cantidades, referencias y datos obligatorios", () => {
    for (const detalle of [
        { origen_producto: "EXTERNO", cantidad: 1 },
        { origen_producto: "EXTERNO", id_producto: 1, descripcion_producto: "Llanta", cantidad: 1 },
        { origen_producto: "OTRO", id_producto: 1, cantidad: 1 }
    ]) assert.throws(() => validateData({ ...body, detalles: [detalle] }), { status: 400 });
    assert.equal(validateData(body).id_proveedor, null);
    assert.deepEqual(validateData({ ...body, detalles: [] }).detalles, []);
    for (const change of [
        { monto: -1 }, { monto: true }, { fecha: "2026-02-30" }, { tipo: " " },
        { detalles: null }, { detalles: [null] },
        { detalles: [{ id_producto: 1, cantidad: 0 }] }
    ]) assert.throws(() => validateData({ ...body, ...change }), { status: 400 });
});

test("Mantenimiento: gasto, facturas, historial e inventario manual", async () => {
    const pool = require("../src/config/database");
    const originalConnect = pool.connect;
    const originalQuery = pool.query;
    const admin = await pool.connect();
    const schema = "mantenimiento_test_" + process.pid;
    const isolated = new Pool({
        ...pool.options,
        password: pool.options.password,
        connectionTimeoutMillis: 5000,
        options: "-c search_path=" + schema + ",public"
    });
    let server;
    try {
        await admin.query("BEGIN");
        await admin.query("CREATE SCHEMA " + schema);
        await admin.query("SET LOCAL search_path TO " + schema + ", public");
        await admin.query(fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8"));
        await admin.query("INSERT INTO vehiculo(placa,capacidad_galones) VALUES ('TEST',100); INSERT INTO categoria_producto(nombre) VALUES ('Test'); INSERT INTO producto(id_categoria,nombre,unidad_medida) VALUES (1,'Filtro','unidad'),(1,'Llanta','unidad'); INSERT INTO movimiento_inventario(id_producto,tipo_movimiento,cantidad,motivo) VALUES (1,'ENTRADA',5,'Inicial'),(2,'ENTRADA',3,'Inicial')");
        await admin.query("COMMIT");
        pool.connect = isolated.connect.bind(isolated);
        pool.query = isolated.query.bind(isolated);
        const authenticatedFetch = await createAuthenticatedFetch(pool);
        server = require("../src/app").listen(0, "127.0.0.1");
        await new Promise(resolve => server.once("listening", resolve));
        const url = `http://127.0.0.1:${server.address().port}/api/mantenimientos`;
        let dia = 1;
        const post = async data => {
            const fecha = '2026-10-' + String(dia++).padStart(2,'0');
            data = { ...data, fecha_inicio: fecha+'T08:00:00', fecha_fin: fecha+'T09:00:00' };
            const response = await authenticatedFetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
            return { status: response.status, body: await response.json() };
        };
        const created = await post(body);
        assert.equal(created.status,201,JSON.stringify(created.body));
        assert.deepEqual(created.body.detalles,[]);
        assert.equal((await post({...body,detalles:[{id_producto:1,cantidad:'2'}]})).status,400);
        assert.equal((await post({...body,detalles:[{origen_producto:'EXTERNO',descripcion_producto:'Material',cantidad:'1'}]})).status,400);
        assert.equal((await isolated.query("SELECT count(*) FROM movimiento_inventario WHERE tipo_movimiento='SALIDA'")).rows[0].count,'0');
        assert.equal((await post({...body,id_vehiculo:9999})).status,400);
        assert.equal((await post({...body,id_proveedor:9999})).status,400);
        const request = async (route, method='GET', data) => {
            const response = await authenticatedFetch(url.replace('/mantenimientos','') + route, {method,
                ...(data === undefined ? {} : {body:JSON.stringify(data)})});
            return {status:response.status,body:await response.json()};
        };
        const trabajo = (await post({...body,clase:'CORRECTIVO',detalles:[]})).body;
        const pagoRuta = '/mantenimientos/'+trabajo.id_mantenimiento+'/pagos';
        assert.equal(trabajo.total_pagado,'25.00');
        assert.equal(trabajo.pagos[0].fecha,trabajo.fecha_inicio.slice(0,10));
        assert.equal(trabajo.pago_directo_automatico,true);
        assert.equal((await request(pagoRuta,'POST',{fecha:'2026-10-30',monto:'10'})).status,409);
        assert.equal((await request('/gastos/'+trabajo.pagos[0].id_gasto+'/anular','POST',{motivo:'Corrección'})).status,409);
        const editData = {...body,clase:'CORRECTIVO',detalles:[],fecha_inicio:trabajo.fecha_inicio,fecha_fin:trabajo.fecha_fin,version:trabajo.version,monto:'30',descripcion:'Corregido'};
        const edited = await request('/mantenimientos/'+trabajo.id_mantenimiento,'PUT',editData);
        assert.equal(edited.status,200,JSON.stringify(edited.body));
        assert.equal(edited.body.total_pagado,'30.00');
        assert.equal(edited.body.pagos.filter(p=>p.estado==='REGISTRADO').length,1);
        assert.equal(edited.body.pagos.filter(p=>p.estado==='ANULADO').length,1);
        assert.equal((await request('/mantenimientos/'+trabajo.id_mantenimiento,'PUT',editData)).status,409);
        const history = await request('/mantenimientos/'+trabajo.id_mantenimiento+'/historial');
        assert.equal(history.body.length,1);
        assert.equal(history.body[0].anterior.monto,'25.00');
        assert.equal(history.body[0].posterior.monto,'30.00');
        assert.ok(history.body[0].id_actor);
        assert.equal((await request('/mantenimientos/'+trabajo.id_mantenimiento+'/anular','POST',{motivo:'Corrección'})).status,200);
        const cancelled = await request('/mantenimientos/'+trabajo.id_mantenimiento);
        assert.ok(cancelled.body.pagos.every(p=>p.estado==='ANULADO'));
        assert.equal((await request('/mantenimientos/'+trabajo.id_mantenimiento,'PUT',{...editData,version:cancelled.body.version})).status,409);
        // Factura externa: sus pagos se reflejan una sola vez, también si preceden a la vinculación.
        const proveedor = (await isolated.query("INSERT INTO proveedor(nombre) VALUES ('Taller') RETURNING id_proveedor")).rows[0].id_proveedor;
        const factura = await request('/facturas-proveedor','POST',{id_proveedor:proveedor,numero_factura:'TALLER-1',fecha_emision:'2026-10-01',
            detalles:[{tipo_concepto:'SERVICIO',descripcion:'Reparación',cantidad:'1',precio_unitario:'25',porcentaje_impuesto:'0'}]});
        assert.equal(factura.status,201,JSON.stringify(factura.body));
        const idFactura = factura.body.id_factura_proveedor;
        const pagarFactura = monto => request('/pagos-proveedor','POST',{id_factura_proveedor:idFactura,fecha_pago:'2026-10-30',monto,forma_pago:'EFECTIVO'});
        assert.equal((await pagarFactura('5')).status,201);
        const conFactura = await post({...body,detalles:[],id_proveedor:proveedor,id_factura_proveedor:idFactura});
        assert.equal(conFactura.status,201,JSON.stringify(conFactura.body));
        const rutaFactura = '/mantenimientos/'+conFactura.body.id_mantenimiento;
        assert.equal((await request(rutaFactura)).body.total_pagado,'5.00');
        assert.equal((await request(rutaFactura+'/pagos','POST',{fecha:'2026-10-30',monto:'1'})).status,409);
        assert.equal((await pagarFactura('20')).status,201);
        const pagado = (await request(rutaFactura)).body;
        assert.equal(pagado.pagos.length,2);
        assert.equal(pagado.total_pagado,'25.00');
        assert.equal((await post({...body,detalles:[],id_proveedor:proveedor,id_factura_proveedor:idFactura})).status,409);
        for(const pago of pagado.pagos) {
            assert.equal((await request('/gastos/'+pago.id_gasto+'/anular','POST',{motivo:'Corrección'})).status,409);
            assert.equal((await request('/pagos-proveedor/'+pago.id_pago_proveedor+'/anular','POST',{motivo:'Corrección'})).status,200);
        }
        assert.equal((await request(rutaFactura)).body.total_pagado,'0');
        assert.equal((await request(rutaFactura+'/anular','POST',{motivo:'Corrección'})).status,409);
        assert.equal((await request('/facturas-proveedor/'+idFactura+'/anular','POST',{motivo:'Corrección'})).status,200);
        assert.equal((await request(rutaFactura+'/anular','POST',{motivo:'Corrección'})).status,200);
        // Crear una factura y el trabajo juntos: el total viene del cálculo de factura.
        const facturaNueva = {numero_factura:'TALLER-NUEVA',fecha_emision:'2026-10-01',detalles:[
            {tipo_concepto:'SERVICIO',descripcion:'Mano de obra y materiales del taller',cantidad:'1',precio_unitario:'100',porcentaje_impuesto:'15'}]};
        const conNueva = await post({...body,detalles:[],monto:undefined,id_proveedor:proveedor,modalidad_pago:'NUEVA',factura:facturaNueva});
        assert.equal(conNueva.status,201,JSON.stringify(conNueva.body));
        assert.equal(conNueva.body.monto,'115.00');
        assert.equal(conNueva.body.total_pagado,'0');
        assert.ok(conNueva.body.id_factura_proveedor);
        const cambiarFactura = await request('/mantenimientos/'+conNueva.body.id_mantenimiento,'PUT',{
            ...body,detalles:[],id_proveedor:proveedor,monto:'116',version:conNueva.body.version,
            fecha_inicio:conNueva.body.fecha_inicio,fecha_fin:conNueva.body.fecha_fin
        });
        assert.equal(cambiarFactura.status,409);
        const fallida = await post({...body,id_vehiculo:9999,id_proveedor:proveedor,modalidad_pago:'NUEVA',factura:{...facturaNueva,numero_factura:'ROLLBACK-TALLER'}});
        assert.equal(fallida.status,400);
        assert.equal((await isolated.query("SELECT count(*) FROM factura_proveedor WHERE numero_factura='ROLLBACK-TALLER'")).rows[0].count,'0');
        // Crear, editar y anular trabajos nuevos no alteran movimientos manuales.
        const movimientosAntes = (await isolated.query('SELECT * FROM movimiento_inventario ORDER BY id_movimiento')).rows;
        const manual = await post({...body,monto:'10'});
        assert.equal(manual.status,201);
        const rutaManual = '/mantenimientos/'+manual.body.id_mantenimiento;
        const editarManual = {...body,version:manual.body.version,fecha_inicio:manual.body.fecha_inicio,fecha_fin:manual.body.fecha_fin};
        assert.equal((await request(rutaManual,'PUT',{...editarManual,detalles:[{id_producto:1,cantidad:'1'}]})).status,400);
        const simultaneas = await Promise.all([1,2].map(()=>request(rutaManual,'PUT',editarManual)));
        assert.deepEqual(simultaneas.map(r=>r.status).sort(),[200,409]);
        assert.equal((await request(rutaManual+'/anular','POST',{motivo:'Corrección'})).status,200);
        assert.deepEqual((await isolated.query('SELECT * FROM movimiento_inventario ORDER BY id_movimiento')).rows,movimientosAntes);
        // Los materiales de trabajos anteriores permanecen consultables al editar, sin revertir stock.
        const legacy = await post(body);
        const detalleLegacy = (await isolated.query("INSERT INTO detalle_mantenimiento(id_mantenimiento,id_producto,cantidad,origen_producto) VALUES ($1,1,1,'INVENTARIO') RETURNING *",[legacy.body.id_mantenimiento])).rows[0];
        await isolated.query("INSERT INTO movimiento_inventario(id_producto,tipo_movimiento,cantidad,motivo,id_detalle_mantenimiento) VALUES(1,'SALIDA',1,'Histórico',$1)",[detalleLegacy.id_detalle_mantenimiento]);
        const movimientosLegacy = (await isolated.query('SELECT * FROM movimiento_inventario ORDER BY id_movimiento')).rows;
        const legacyEdit = await request('/mantenimientos/'+legacy.body.id_mantenimiento,'PUT',{
            ...body,version:legacy.body.version,fecha_inicio:legacy.body.fecha_inicio,fecha_fin:legacy.body.fecha_fin,descripcion:'Texto corregido'
        });
        assert.equal(legacyEdit.status,200,JSON.stringify(legacyEdit.body));
        assert.equal(legacyEdit.body.detalles.length,1);
        assert.deepEqual((await isolated.query('SELECT * FROM movimiento_inventario ORDER BY id_movimiento')).rows,movimientosLegacy);
    } finally {
        if (server) await new Promise(resolve => server.close(resolve));
        pool.connect = originalConnect;
        pool.query = originalQuery;
        await isolated.end();
        await admin.query("ROLLBACK");
        // Nombre fijo generado arriba, exclusivo de esta prueba.
        await admin.query("DROP SCHEMA IF EXISTS " + schema + " CASCADE");
        admin.release();
        await pool.end();
    }
});
