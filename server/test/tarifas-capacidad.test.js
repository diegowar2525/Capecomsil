const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
const pool = require('../src/config/database');
const { createAuthenticatedFetch } = require('./helpers/authenticated-fetch');
const validators = require('../src/utils/validators/tarifa_capacidad.validators');

test('Tarifas por capacidad: validación de cuatro capacidades, vigencias y campos estrictos', () => {
    const base = { id_gasolinera:1, capacidad_galones:8000,valor_por_galon:'0.1234',fecha_inicio:'2026-10-01' };
    for (const capacidad of [4000,6000,8000,10000]) assert.equal(validators.validateData({...base,capacidad_galones:capacidad}).capacidad_galones,capacidad);
    for (const patch of [{capacidad_galones:5000},{valor_por_galon:-1},{fecha_fin:'2026-09-01'},{id_terminal:1},{estado:'true'}]) {
        assert.throws(()=>validators.validateData({...base,...patch}),{status:400});
    }
    assert.throws(()=>require('../src/utils/validators/modalidad_tarifa.validators').validateData({id_gasolinera:1,modalidad:'OTRA',fecha_inicio:'2026-10-01'}),{status:400});
});

test('Capacidad HTTP: migración con historial, terminal independiente, edición, liquidaciones y concurrencia', async () => {
    const admin = await pool.connect();
    const originalQuery=pool.query, originalConnect=pool.connect;
    const name='tarifas_capacidad_test_'+process.pid;
    const isolated=new Pool({...pool.options,password:pool.options.password,options:'-c search_path='+name+',public'});
    let server;
    try {
        await admin.query('BEGIN');
        await admin.query(`CREATE SCHEMA ${name}`);
        await admin.query(`SET LOCAL search_path TO ${name},public`);
        const schema=fs.readFileSync(path.join(__dirname,'../../database/schema.sql'),'utf8');
        await admin.query(schema.split('-- Modalidades históricas y tarifas por capacidad.')[0]);
        await admin.query(`INSERT INTO vehiculo(placa,capacidad_galones) VALUES ('C4',4000),('C6',6000),('C8',8000),('C10',10000),('C5',5000);
            INSERT INTO chofer(nombre,cedula,tipo_remuneracion) VALUES ('Prueba capacidad','CAP','DIA_TRABAJADO');
            INSERT INTO gasolinera(nombre) VALUES ('Especial'),('Normal');
            INSERT INTO terminal(nombre) VALUES ('T1'),('T2');
            INSERT INTO producto_transportado(nombre,unidad_medida) VALUES ('Diesel','galones');
            INSERT INTO tarifa(id_gasolinera,id_terminal,valor_por_galon,fecha_inicio) VALUES (1,1,.10,'2026-01-01'),(2,1,.20,'2026-01-01');
            INSERT INTO trayecto(nombre,id_terminal_origen,id_gasolinera_destino,kilometros) VALUES ('T1-A',1,1,10);
            INSERT INTO trayecto(nombre,id_gasolinera_origen,id_gasolinera_destino,kilometros) VALUES ('A-B',1,2,20);
            INSERT INTO trayecto(nombre,id_terminal_origen,id_gasolinera_destino,kilometros) VALUES ('T2-A',2,1,40);
            INSERT INTO configuracion_peaje_trayecto(id_trayecto,importe,fecha_inicio) SELECT id_trayecto,0,'2026-01-01' FROM trayecto;
            INSERT INTO configuracion_remuneracion(importe_diario,adicional_dia_especial,fecha_inicio) VALUES (35,35,'2026-01-01');
            INSERT INTO configuracion_viatico(importe_diario,fecha_inicio) VALUES (12,'2026-01-01');
            INSERT INTO configuracion_combustible(consumo_galones_km,precio_por_galon,fecha_inicio) VALUES (.1,3,'2026-01-01');
            INSERT INTO viaje(id_vehiculo,id_chofer,fecha_inicio,fecha_fin) VALUES (4,1,'2026-09-01 08:00','2026-09-01 09:00');
            INSERT INTO tramo_viaje(id_viaje,orden,id_trayecto,kilometros,id_configuracion_peaje_trayecto,peaje_aplicado) VALUES (1,1,1,10,1,0);
            INSERT INTO detalle_viaje(id_viaje,id_tarifa,id_producto_transportado,galones,tarifa_aplicada,valor_transporte) VALUES (1,1,1,3000,.10,300);
            INSERT INTO liquidacion(id_gasolinera,periodo_inicio,periodo_fin) VALUES (1,'2026-09-01','2026-09-30');
            INSERT INTO detalle_liquidacion(id_liquidacion,id_detalle_viaje) VALUES (1,1);`);
        await admin.query('SET CONSTRAINTS ALL IMMEDIATE');
        const migration=fs.readFileSync(path.join(__dirname,'../../database/migrations/024_tarifas_capacidad.sql'),'utf8');
        await admin.query(migration.replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,''));
        assert.equal((await admin.query('SELECT valor_transporte FROM detalle_viaje WHERE id_detalle_viaje=1')).rows[0].valor_transporte,'300.00');
        assert.equal((await admin.query('SELECT tarifa_aplicada FROM detalle_liquidacion WHERE id_liquidacion=1')).rows[0].tarifa_aplicada,'0.1000');
        await admin.query('COMMIT');
        pool.query=isolated.query.bind(isolated); pool.connect=isolated.connect.bind(isolated);
        const jefe=await createAuthenticatedFetch(isolated), operador=await createAuthenticatedFetch(isolated,'OPERADOR');
        server=require('../src/app').listen(0,'127.0.0.1'); await new Promise(resolve=>server.once('listening',resolve));
        const base=`http://127.0.0.1:${server.address().port}/api`;
        const request=async(route,method='GET',body,client=jefe)=>{
            const res=await client(base+route,{method,...(body===undefined?{}:{body:JSON.stringify(body)})});
            return {status:res.status,body:await res.json()};
        };
        const mode={id_gasolinera:1,modalidad:'POR_CAPACIDAD',fecha_inicio:'2026-10-01'};
        assert.equal((await request('/modalidades-tarifa','POST',mode,operador)).status,403);
        assert.equal((await request('/modalidades-tarifa','POST',mode)).status,201);
        const history=(await request('/modalidades-tarifa?id_gasolinera=1')).body;
        assert.equal(history.length,2); assert.equal(history[1].fecha_fin,'2026-09-30');
        assert.equal((await request('/modalidades-tarifa','POST',mode)).status,409);
        const rate=cap=>({id_gasolinera:1,capacidad_galones:cap,valor_por_galon:({4000:'.11',6000:'.12',8000:'.13',10000:'.14'})[cap].replace('.','0.'),fecha_inicio:'2026-10-01'});
        const ids={};
        for (const cap of [4000,6000,10000]) { const res=await request('/tarifas-capacidad','POST',rate(cap)); assert.equal(res.status,201,JSON.stringify(res.body)); ids[cap]=res.body.id_tarifa_capacidad; }
        // Volver inmediatamente a terminal y capacidad conserva el período nuevo,
        // incluso con tarifas configuradas y operaciones en el período anterior.
        for (const modalidad of ['POR_TERMINAL', 'POR_CAPACIDAD']) {
            const corrected = await request('/modalidades-tarifa', 'POST', { ...mode, modalidad });
            assert.equal(corrected.status, 201, JSON.stringify(corrected.body));
            assert.equal(corrected.body.id_modalidad_tarifa, history[0].id_modalidad_tarifa);
            const current = (await request('/modalidades-tarifa?id_gasolinera=1')).body;
            assert.equal(current.length, 2);
            assert.deepEqual(current[1], history[1]);
        }
        assert.equal((await request('/tarifas-capacidad','POST',rate(8000),operador)).status,403);
        assert.equal((await request('/tarifas-capacidad','GET',undefined,operador)).status,200);
        const trip=(veh,day,terminal=1)=>({id_vehiculo:veh,id_chofer:1,fecha_inicio:`2026-10-${day}T08:00:00`,fecha_fin:`2026-10-${day}T09:00:00`,
            tramos:[{orden:1,id_trayecto:terminal===1?1:3}],detalles:[{id_terminal:terminal,id_gasolinera:1,id_producto_transportado:1,galones:'3000'}]});
        const missing=await request('/viajes','POST',trip(3,'03'));
        assert.equal(missing.status,409); assert.match(missing.body.message,/8000/);
        assert.equal((await request('/viajes','POST',trip(5,'05'))).status,409);
        const concurrent=await Promise.all([request('/tarifas-capacidad','POST',rate(8000)),request('/tarifas-capacidad','POST',rate(8000))]);
        assert.deepEqual(concurrent.map(r=>r.status).sort(),[201,409]);
        let first;
        for (const [veh,price] of [[1,'330.00'],[2,'360.00'],[3,'390.00'],[4,'420.00']]) {
            const res=await request('/viajes','POST',trip(veh,'0'+veh)); assert.equal(res.status,201,JSON.stringify(res.body));
            assert.equal(res.body.detalles[0].valor_transporte,price); assert.equal(res.body.detalles[0].id_tarifa,null);
            if (veh===1) first=res.body;
        }
        const secondTerminal=await request('/viajes','POST',trip(1,'06',2));
        assert.equal(secondTerminal.status,201,JSON.stringify(secondTerminal.body));
        assert.equal(secondTerminal.body.detalles[0].valor_transporte,'330.00');
        assert.equal(secondTerminal.body.detalles[0].id_terminal,2);
        const mixed=trip(1,'07'); mixed.tramos.push({orden:2,id_trayecto:2});
        mixed.detalles.push({id_terminal:1,id_gasolinera:2,id_producto_transportado:1,galones:'500'});
        const mixto=await request('/viajes','POST',mixed); assert.equal(mixto.status,201,JSON.stringify(mixto.body));
        assert.equal(mixto.body.detalles[1].valor_transporte,'100.00');
        const historical=trip(1,'08'); historical.fecha_inicio='2026-09-02T08:00:00'; historical.fecha_fin='2026-09-02T09:00:00';
        const old=await request('/viajes','POST',historical); assert.equal(old.status,201,JSON.stringify(old.body));
        assert.equal(old.body.detalles[0].valor_transporte,'300.00');
        assert.equal((await request('/tarifas-capacidad/'+ids[4000],'PUT',{...rate(4000),valor_por_galon:'0.99'})).status,409);
        assert.equal((await request('/tarifas-capacidad/'+ids[4000],'DELETE')).status,409);
        assert.equal((await request('/modalidades-tarifa','POST',{...mode,modalidad:'POR_TERMINAL',fecha_inicio:'2026-10-02'})).status,409);
        assert.equal((await request('/modalidades-tarifa?id_gasolinera=1')).body.length,2);
        const edit={...trip(2,'01'),version:first.version,motivo:'Cambio de vehículo',
            detalles:[{...trip(2,'01').detalles[0],id_detalle_viaje:first.detalles[0].id_detalle_viaje}],
            tramos:[{orden:1,id_trayecto:1,id_tramo_viaje:first.tramos[0].id_tramo_viaje}]};
        const edited=await request('/viajes/'+first.id_viaje,'PUT',edit); assert.equal(edited.status,200,JSON.stringify(edited.body));
        assert.equal(edited.body.detalles[0].valor_transporte,'360.00');
        let liquidacion=await request('/liquidaciones','POST',{id_gasolinera:1,periodo_inicio:'2026-10-01',periodo_fin:'2026-10-31',id_detalles_viaje:[first.detalles[0].id_detalle_viaje]});
        assert.equal(liquidacion.status,201,JSON.stringify(liquidacion.body)); assert.equal(liquidacion.body.total_liquidacion,'360.00');
        for (const action of ['enviar','confirmar']) {
            liquidacion=await request(`/liquidaciones/${liquidacion.body.id_liquidacion}/${action}`,'POST',{version:liquidacion.body.version});
            assert.equal(liquidacion.status,200,JSON.stringify(liquidacion.body));
        }
        const filtered=await request('/viajes?id_gasolinera=1&id_terminal=2');
        assert.ok(filtered.body.some(v=>v.id_viaje===secondTerminal.body.id_viaje));
        await isolated.query("INSERT INTO gasolinera(nombre) VALUES ('Nueva')");
        assert.equal((await request('/modalidades-tarifa?id_gasolinera=3')).body[0].modalidad,'POR_TERMINAL');
        const inicial = (await request('/modalidades-tarifa?id_gasolinera=3')).body[0];
        for (const modalidad of ['POR_CAPACIDAD', 'POR_TERMINAL']) {
            const corregida = await request('/modalidades-tarifa', 'POST', {
                id_gasolinera: 3, modalidad, fecha_inicio: inicial.fecha_inicio
            });
            assert.equal(corregida.status, 201, JSON.stringify(corregida.body));
            assert.equal(corregida.body.id_modalidad_tarifa, inicial.id_modalidad_tarifa);
            assert.equal(corregida.body.fecha_inicio, inicial.fecha_inicio);
            assert.equal(corregida.body.modalidad, modalidad);
            assert.equal((await request('/modalidades-tarifa?id_gasolinera=3')).body.length, 1);
        }
        await isolated.query("INSERT INTO tarifa(id_gasolinera,id_terminal,valor_por_galon,fecha_inicio) VALUES (3,1,.10,'2026-01-01')");
        assert.equal((await request('/modalidades-tarifa', 'POST', {
            id_gasolinera: 3, modalidad: 'POR_CAPACIDAD', fecha_inicio: inicial.fecha_inicio
        })).status, 201);
        await isolated.query("UPDATE modalidad_tarifa_gasolinera SET fecha_fin='2026-09-30' WHERE id_gasolinera=3");
        await isolated.query("INSERT INTO modalidad_tarifa_gasolinera(id_gasolinera,modalidad,fecha_inicio) VALUES (3,'POR_CAPACIDAD','2026-10-01')");
        assert.equal((await request('/modalidades-tarifa?id_gasolinera=3')).body.length, 2);
        await isolated.query("UPDATE tarifa SET fecha_fin='2026-09-30' WHERE id_gasolinera=3");
        const antes = (await request('/modalidades-tarifa?id_gasolinera=3')).body;
        const reemplazo = await request('/modalidades-tarifa', 'POST', {
            id_gasolinera: 3, modalidad: 'POR_TERMINAL', fecha_inicio: '2026-10-15'
        });
        assert.equal(reemplazo.status, 201, JSON.stringify(reemplazo.body));
        assert.equal(reemplazo.body.id_modalidad_tarifa, antes[0].id_modalidad_tarifa);
        assert.equal(reemplazo.body.fecha_inicio, antes[0].fecha_inicio);
        assert.equal(reemplazo.body.fecha_fin, antes[0].fecha_fin);
        const despues = (await request('/modalidades-tarifa?id_gasolinera=3')).body;
        assert.equal(despues.length, 2);
        assert.deepEqual(despues[1], antes[1]);
        assert.equal(despues[0].modalidad, 'POR_TERMINAL');
        await isolated.query("INSERT INTO tarifa(id_gasolinera,id_terminal,valor_por_galon,fecha_inicio) VALUES (3,1,.10,'2026-10-01')");
        await isolated.query("INSERT INTO liquidacion(id_gasolinera,periodo_inicio,periodo_fin) VALUES (3,'2026-10-01','2026-10-31')");
        assert.equal((await request('/modalidades-tarifa', 'POST', {
            id_gasolinera: 3, modalidad: 'POR_CAPACIDAD', fecha_inicio: '2026-10-01'
        })).status, 409);
        assert.deepEqual((await request('/modalidades-tarifa?id_gasolinera=3')).body, despues);
        await isolated.query('DELETE FROM liquidacion WHERE id_gasolinera=3');
        await isolated.query('DELETE FROM tarifa WHERE id_gasolinera=3');
        await isolated.query('DELETE FROM gasolinera WHERE id_gasolinera=3');
    } finally {
        if(server) await new Promise(resolve=>server.close(resolve));
        pool.query=originalQuery; pool.connect=originalConnect;
        await isolated.end(); await admin.query('ROLLBACK');
        await admin.query(`DROP SCHEMA IF EXISTS ${name} CASCADE`); admin.release(); await pool.end();
    }
});

