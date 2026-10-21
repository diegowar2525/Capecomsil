const { createAuthenticatedFetch } = require("./helpers/authenticated-fetch");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

test("Seguimiento: kilómetros, planes independientes, historial, cortes y concurrencia", async () => {
    const pool = require("../src/config/database");
    const connect = pool.connect, query = pool.query;
    const admin = await pool.connect();
    const schema = "seguimiento_test_" + process.pid;
    const isolated = new Pool({ ...pool.options,password: pool.options.password,options: "-c search_path="+schema+",public" });
    let server;
    try {
        await admin.query("BEGIN");
        await admin.query("CREATE SCHEMA " + schema);
        await admin.query("SET LOCAL search_path TO " + schema + ",public");
        await admin.query(fs.readFileSync(path.join(__dirname,"../../database/schema.sql"),"utf8"));
        await admin.query(`INSERT INTO vehiculo(placa,capacidad_galones,kilometraje_base,fecha_inicio_control_km)
            VALUES ('V1',100,1000,'2026-10-01'),('V2',100,0,'2026-10-01'),('SIN-CONTROL',100,NULL,NULL);
            INSERT INTO chofer(nombre,cedula,tipo_remuneracion) VALUES ('C1','C1','DIARIO_FIJO'),('C2','C2','DIARIO_FIJO');
            INSERT INTO terminal(nombre) VALUES ('T'); INSERT INTO gasolinera(nombre) VALUES ('G');
            INSERT INTO producto_transportado(nombre,unidad_medida) VALUES ('Diesel','galón');
            INSERT INTO tarifa(id_gasolinera,id_terminal,valor_por_galon,fecha_inicio) VALUES (1,1,0.04,'2026-01-01');
            INSERT INTO configuracion_remuneracion(importe_diario,adicional_dia_especial,fecha_inicio) VALUES (35,35,'2026-01-01');
            INSERT INTO configuracion_viatico(importe_diario,fecha_inicio) VALUES (12,'2026-01-01');
            INSERT INTO configuracion_combustible(consumo_galones_km,precio_por_galon,fecha_inicio) VALUES (0.1,3,'2026-01-01');
            INSERT INTO trayecto(nombre,id_terminal_origen,id_gasolinera_destino,kilometros) VALUES ('Prueba de umbrales',1,1,4000);
            INSERT INTO configuracion_peaje_trayecto(id_trayecto,importe,fecha_inicio) VALUES (1,0,'2026-01-01');`);
        await admin.query("COMMIT");
        pool.connect = isolated.connect.bind(isolated); pool.query = isolated.query.bind(isolated);
        const authenticatedFetch = await createAuthenticatedFetch(pool);
        server = require("../src/app").listen(0,"127.0.0.1");
        await new Promise(resolve => server.once("listening",resolve));
        const req = async (route,method="GET",body) => {
            const r = await authenticatedFetch(`http://127.0.0.1:${server.address().port}/api${route}`,{
                method,headers:{"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)
            });
            return {status:r.status,body:await r.json()};
        };
        const datosPlan = {id_vehiculo:1,nombre:"Servicio 8000",intervalo_km:"8000",kilometraje_referencia_inicial:"1000",anticipacion_aviso_km:"4000"};
        const p1 = await req("/planes-mantenimiento","POST",datosPlan);
        assert.equal(p1.status,201,JSON.stringify(p1));
        const id1=p1.body.id_plan_mantenimiento_vehiculo;
        const p2=await req("/planes-mantenimiento","POST",{...datosPlan,nombre:"Servicio 80000",intervalo_km:"80000"});
        const id2=p2.body.id_plan_mantenimiento_vehiculo;
        const corte="?fecha_hasta=2026-10-31T23:59:59";
        const plan = async id => (await req(`/planes-mantenimiento/${id}${corte}`)).body;
        const km = async (id=1,fecha="2026-10-31T23:59:59") => (await req(`/vehiculos/${id}/kilometraje?fecha_hasta=${fecha}`)).body;
        assert.equal((await plan(id1)).situacion,"AL_DIA");
        assert.equal((await km()).kilometraje_estimado,"1000.00");
        for (const patch of [{intervalo_km:0},{estado:"ACTIVO"},{id_vehiculo:999}]) {
            assert.equal((await req("/planes-mantenimiento","POST",{...datosPlan,...patch})).status,400);
        }
        assert.equal((await req("/planes-mantenimiento","POST",{...datosPlan,kilometraje_referencia_inicial:"1001"})).status,409);
        assert.equal((await req("/planes-mantenimiento?situacion=OTRA")).status,400);
        assert.equal((await req("/vehiculos/999/kilometraje")).status,404);
        assert.equal((await km(3)).kilometraje_estimado,null);
        const sinControl=await req("/planes-mantenimiento","POST",{...datosPlan,id_vehiculo:3,kilometraje_referencia_inicial:0});
        assert.equal((await plan(sinControl.body.id_plan_mantenimiento_vehiculo)).situacion,"SIN_CONFIGURAR");
        const viaje = async (dia,inicio="08:00",fin="09:00",extra={}) => {
            const r=await req("/viajes","POST",{id_vehiculo:1,id_chofer:1,
                fecha_inicio:`2026-${dia}T${inicio}:00`,fecha_fin:`2026-${dia}T${fin}:00`,
                tramos:[{orden:1,id_trayecto:1}],detalles:[{id_terminal:1,id_gasolinera:1,id_producto_transportado:1,galones:"50"}],...extra});
            assert.equal(r.status,201,JSON.stringify(r));return r.body;
        };
        await viaje("09-30"); // anterior al control: excluido
        await viaje("10-01");
        assert.equal((await km()).kilometraje_estimado,"5000.00");
        assert.equal((await km(1,"2026-10-01T08:30:00")).kilometraje_estimado,"1000.00");
        assert.equal((await plan(id1)).situacion,"PROXIMO");
        await viaje("10-02");
        assert.equal((await plan(id1)).situacion,"VENCIDO");
        assert.equal((await plan(id1)).kilometros_restantes,"0.00");
        assert.equal((await plan(id2)).situacion,"AL_DIA");
        const mantenimiento=async(dia,planes,fin="09:00",extra={}) => req("/mantenimientos","POST",{
            id_vehiculo:1,fecha_inicio:`2026-10-${dia}T08:00:00`,fecha_fin:fin?`2026-10-${dia}T${fin}:00`:null,
            tipo:"Servicio",monto:"0",detalles:[],planes_cumplidos:planes,...extra
        });
        const m1=await mantenimiento("03",[id1]);assert.equal(m1.status,201,JSON.stringify(m1));
        assert.equal(m1.body.cumplimientos[0].kilometraje_aplicado,"9000.00");
        assert.equal((await plan(id1)).proximo_mantenimiento_km,"17000.00");
        assert.equal((await plan(id2)).proximo_mantenimiento_km,"81000.00");
        assert.equal((await req(`/planes-mantenimiento/${id1}`,"DELETE")).status,409);
        assert.equal((await req(`/planes-mantenimiento/${id1}`,"PUT",{...datosPlan,kilometraje_referencia_inicial:0})).status,409);
        await viaje("10-04");
        const m2=await mantenimiento("05",[id1]);assert.equal(m2.status,201);
        assert.equal((await plan(id1)).proximo_mantenimiento_km,"21000.00");
        assert.equal((await req(`/mantenimientos/${m2.body.id_mantenimiento}/anular`,"POST",{motivo:"Corrección"})).status,200);
        assert.equal((await plan(id1)).id_ultimo_mantenimiento,m1.body.id_mantenimiento);
        assert.equal((await plan(id1)).proximo_mantenimiento_km,"17000.00");
        const retro=await viaje("10-02","10:00","11:00");
        assert.equal((await req(`/mantenimientos/${m1.body.id_mantenimiento}`)).body.cumplimientos[0].kilometraje_aplicado,"13000.00");
        assert.equal((await plan(id1)).proximo_mantenimiento_km,"21000.00");
        await req(`/viajes/${retro.id_viaje}/anular`,"POST",{motivo:"Corrección"});
        assert.equal((await plan(id1)).proximo_mantenimiento_km,"17000.00");
        assert.equal((await km()).kilometraje_estimado,"13000.00");
        await req(`/mantenimientos/${m1.body.id_mantenimiento}/anular`,"POST",{motivo:"Corrección"});
        assert.equal((await plan(id1)).situacion,"VENCIDO");
        assert.equal((await plan(id1)).kilometros_excedidos,"4000.00");
        assert.equal((await req(`/planes-mantenimiento/${id1}`,"PUT",{...datosPlan,estado:false})).status,200);
        assert.equal((await plan(id1)).situacion,"INACTIVO");
        assert.equal((await mantenimiento("06",[id1])).status,409);
        assert.equal((await req(`/planes-mantenimiento/${id1}`,"PUT",datosPlan)).status,200);
        assert.equal((await mantenimiento("06",[id1,id1])).status,400);
        assert.equal((await mantenimiento("06",[id1],null)).status,400);
        const abierto=await mantenimiento("06",[],null);assert.equal(abierto.status,201);
        // Un plan de otro vehículo debe revertir también la finalización.
        const ajeno=await req("/planes-mantenimiento","POST",{...datosPlan,id_vehiculo:2,kilometraje_referencia_inicial:0});
        const finalizar=planes=>req(`/mantenimientos/${abierto.body.id_mantenimiento}/finalizar`,"POST",{
            fecha_fin:"2026-10-07T09:00:00",planes_cumplidos:planes});
        assert.equal((await finalizar([ajeno.body.id_plan_mantenimiento_vehiculo])).status,409);
        assert.equal((await req(`/mantenimientos/${abierto.body.id_mantenimiento}`)).body.fecha_fin,null);
        assert.equal((await finalizar([id1,id2])).status,200);
        assert.equal((await plan(id2)).proximo_mantenimiento_km,"93000.00");
        const registro=await mantenimiento("08",[]);assert.equal(registro.status,201);
        const cumplir=()=>req(`/mantenimientos/${registro.body.id_mantenimiento}/cumplimientos`,"POST",{planes_cumplidos:[id1]});
        const competencia=await Promise.all([cumplir(),cumplir()]);
        assert.deepEqual(competencia.map(r=>r.status).sort(),[201,409]);
        await assert.rejects(isolated.query("UPDATE vehiculo SET kilometraje_base=0 WHERE id_vehiculo=1"),{constraint:"seguimiento_base_historial"});
        assert.equal((await req(`/planes-mantenimiento/${ajeno.body.id_plan_mantenimiento_vehiculo}`,"DELETE")).status,200);
        const alertas=await req("/planes-mantenimiento?estado=true&situacion=AL_DIA&fecha_hasta=2026-10-31T23:59:59");
        assert.equal(alertas.status,200);assert.ok(alertas.body.every(p=>p.estado && p.situacion==="AL_DIA"));
    } finally {
        if (server) await new Promise(resolve=>server.close(resolve));
        pool.connect=connect;pool.query=query;
        await isolated.end();await admin.query("ROLLBACK");
        await admin.query("DROP SCHEMA IF EXISTS "+schema+" CASCADE");admin.release();await pool.end();
    }
});
