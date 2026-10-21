const { createAuthenticatedFetch } = require("./helpers/authenticated-fetch");
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

test("Informes: agregación sin duplicados, datos pendientes e intervalos de tanque lleno", async () => {
    const pool = require("../src/config/database");
    const connect = pool.connect, query = pool.query;
    const admin = await pool.connect();
    const schema = "informes_test_" + process.pid;
    const isolated = new Pool({ ...pool.options, password: pool.options.password, options: "-c search_path=" + schema + ",public" });
    let server;
    try {
        await admin.query("BEGIN");
        await admin.query("CREATE SCHEMA " + schema);
        await admin.query("SET LOCAL search_path TO " + schema + ",public");
        await admin.query(fs.readFileSync(path.join(__dirname,"../../database/schema.sql"),"utf8"));
        await admin.query(`INSERT INTO vehiculo(placa,capacidad_galones) VALUES ('I1',100),('I2',100);
            INSERT INTO chofer(nombre,cedula,tipo_remuneracion) VALUES ('C','C','DIARIO_FIJO');
            INSERT INTO configuracion_viatico(importe_diario,fecha_inicio) VALUES (12,'2026-01-01');
            INSERT INTO terminal(nombre) VALUES ('T'); INSERT INTO gasolinera(nombre) VALUES ('G');
            INSERT INTO producto_transportado(nombre,unidad_medida) VALUES ('Diesel','galón'),('Extra','galón');
            INSERT INTO tarifa(id_gasolinera,id_terminal,valor_por_galon,fecha_inicio) VALUES (1,1,1,'2026-01-01');
            INSERT INTO configuracion_remuneracion(importe_diario,adicional_dia_especial,fecha_inicio) VALUES (35,35,'2026-01-01');
            INSERT INTO configuracion_combustible(consumo_galones_km,precio_por_galon,fecha_inicio) VALUES (0.1,3,'2026-01-01');
            INSERT INTO trayecto(nombre,id_terminal_origen,id_gasolinera_destino,kilometros) VALUES ('T-G',1,1,50);
            INSERT INTO configuracion_peaje_trayecto(id_trayecto,importe,fecha_inicio) VALUES (1,2,'2026-01-01');`);
        await admin.query("COMMIT");
        pool.connect = isolated.connect.bind(isolated); pool.query = isolated.query.bind(isolated);
        const authenticatedFetch = await createAuthenticatedFetch(pool);
        server = require("../src/app").listen(0,"127.0.0.1");
        await new Promise(resolve => server.once("listening",resolve));
        const req = async (route,method="GET",body,status=200) => {
            const r = await authenticatedFetch(`http://127.0.0.1:${server.address().port}/api${route}`,{
                method,headers:{"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)
            });
            const result = await r.json();
            assert.equal(r.status,status,JSON.stringify(result));
            return result;
        };
        const detalle = {id_terminal:1,id_gasolinera:1,id_producto_transportado:1,galones:"50"};
        const viaje = async (dia,hora,detalles=[detalle]) => req("/viajes","POST",{
            id_vehiculo:1,id_chofer:1,fecha_inicio:`2026-10-${dia}T${hora}:00`,fecha_fin:`2026-10-${dia}T${hora}:59`,
            tramos:[{orden:1,id_trayecto:1}],detalles
        },201);
        // Dos conceptos en el primer viaje; dos gastos de peaje: sus joins no deben multiplicar importes.
        const v1 = await viaje("02","08",[{...detalle,galones:"40"},{...detalle,id_producto_transportado:2,galones:"60"}]);
        const v2 = await viaje("02","10");
        const gasto = async (patch) => req("/gastos","POST",{fecha:"2026-10-02",tipo_gasto:"PEAJE",monto:"3",...patch},201);
        await gasto({id_viaje:v1.id_viaje});
        await gasto({id_viaje:v1.id_viaje,monto:"4"});
        const anulado = await gasto({id_viaje:v1.id_viaje,monto:"99"});
        await req(`/gastos/${anulado.id_gasto}/anular`,"POST",{motivo:"Duplicado"});
        const diario = (await isolated.query("SELECT id_viatico_chofer FROM viatico_chofer WHERE fecha='2026-10-02'")).rows[0].id_viatico_chofer;
        await gasto({tipo_gasto:"VIATICO",id_viatico_chofer:diario,monto:"6"});
        await gasto({tipo_gasto:"VIATICO",id_viatico_chofer:diario,monto:"8",fecha:"2026-11-01"});
        await gasto({tipo_gasto:"OTRO",monto:"11"});
        const carga = async (dia,odometro,galones,lleno=true,extra={}) => req("/abastecimientos-combustible","POST",{
            id_vehiculo:1,fecha_hora:`2026-10-${dia}T07:00`,kilometraje_odometro:String(odometro),galones:String(galones),
            precio_por_galon:"3",tanque_lleno:lleno,...extra
        },201);
        const inicial = await carga("01",1000,50);
        await carga("02",1050,4,false,{fecha_hora:"2026-10-02T09:30"});
        const final = await carga("03",1100,8);
        const base = "?fecha_desde=2026-10-01&fecha_hasta=2026-10-31";
        const filas = await req("/informes/viajes"+base);
        const fila = filas.find(v=>v.id_viaje===v1.id_viaje);
        assert.equal(fila.ingreso_transporte,"100.00");
        assert.equal(fila.costo_estimado_total,"40.50");
        assert.equal(fila.margen_estimado,"59.50");
        assert.equal(fila.peaje_real_registrado,"7.00");
        assert.equal(fila.diferencia_peaje,"5.00");
        assert.equal(fila.diferencia_peaje_porcentaje,"250.00");
        assert.equal(fila.margen_real,null);
        assert.equal(filas.find(v=>v.id_viaje===v2.id_viaje).peaje_real_registrado,null);
        const viaticos = await req("/informes/viaticos"+base+"&id_chofer=1");
        assert.equal(viaticos[0].estimado,"12.00");
        assert.equal(viaticos[0].gasto_real_registrado,"14.00");
        assert.equal(viaticos[0].diferencia,"2.00");
        const periodo = await req("/informes/resumen-economico"+base+"&limit=1");
        assert.equal(periodo.cantidad_viajes,2);
        assert.equal(periodo.ingreso_transporte,"150.00");
        assert.equal(periodo.costo_estimado_viajes,"81.00");
        assert.equal(periodo.margen_estimado_viajes,"69.00");
        assert.equal(periodo.gastos_registrados_periodo,"210.00");
        assert.equal(periodo.conceptos.find(c=>c.tipo==="VIATICO").gasto_registrado,"6.00");
        const consumo = await req("/informes/consumo-combustible?fecha_desde=2026-10-03&fecha_hasta=2026-10-03&id_vehiculo=1");
        assert.equal(consumo.length,1);
        assert.equal(consumo[0].id_abastecimiento_inicio,inicial.id_abastecimiento_combustible);
        assert.equal(consumo[0].galones_consumidos,"12.0000");
        assert.equal(consumo[0].importe_comprado_intervalo,"36.00");
        assert.equal(consumo[0].consumo_real_galones_km,"0.120000");
        assert.equal(consumo[0].consumo_referencia_galones_km,"0.100000");
        assert.equal(consumo[0].desviacion_porcentaje,"20.00");
        assert.equal(consumo[0].supera_referencia,true);
        assert.equal(consumo[0].estado_comparacion,"COMPARABLE");
        // El informe usa snapshots del viaje, no los kilómetros actuales del catálogo.
        await isolated.query("UPDATE trayecto SET kilometros=75 WHERE id_trayecto=1");
        const historico = await req("/informes/consumo-combustible"+base);
        assert.equal(historico[0].kilometros_viajes,"100.00");
        assert.equal(historico[1].estado_comparacion,"SIN_CARGA_INICIAL");
        assert.equal(historico[1].consumo_real_galones_km,null);
        const cancelado = await viaje("04","08");
        await gasto({id_viaje:cancelado.id_viaje,monto:"5"});
        await req(`/viajes/${cancelado.id_viaje}/anular`,"POST",{motivo:"Error"});
        await isolated.query("SELECT recalcular_remuneracion(1,'2026-10-05')");
        const actualizado = await req("/informes/resumen-economico"+base);
        assert.equal(actualizado.cantidad_viajes,2);
        assert.equal(actualizado.gastos_de_viajes_anulados,"5.00");
        assert.equal(actualizado.remuneracion_generada_sin_viajes,"35.00");
        assert.equal((await req("/informes/resumen-economico"+base+"&id_vehiculo=1")).remuneracion_generada_sin_viajes,null);
        const paginado = await req("/informes/viajes"+base+"&limit=1&offset=1");
        assert.equal(paginado.length,1);
        assert.equal(paginado[0].total_registros,2);
        assert.deepEqual(await req("/informes/viajes"+base+"&id_vehiculo=2"),[]);
        assert.equal((await req("/informes/resumen-economico?fecha_desde=2025-01-01&fecha_hasta=2025-01-31")).cantidad_viajes,0);
        for (const q of ["", "?fecha_desde=2026-02-30&fecha_hasta=2026-03-01",
            "?fecha_desde=2026-10-02&fecha_hasta=2026-10-01", "?fecha_desde=2025-01-01&fecha_hasta=2026-10-01",
            base+"&limit=201",base+"&offset=-1",base+"&id_vehiculo=abc",base+"&estado=ANULADO"]) {
            await req("/informes/viajes"+q,"GET",undefined,400);
        }
        await req("/informes/viaticos"+base+"&id_vehiculo=1","GET",undefined,400);
        // Eliminar un cierre reconstruye el intervalo siguiente incluyendo las cargas parciales.
        await carga("05",1200,10);
        await req(`/abastecimientos-combustible/${final.id_abastecimiento_combustible}/anular`,"POST",{motivo:"Error"});
        const recalculado = (await req("/informes/consumo-combustible"+base))[0];
        assert.equal(recalculado.id_abastecimiento_inicio,inicial.id_abastecimiento_combustible);
        assert.equal(recalculado.galones_consumidos,"14.0000");
        assert.equal(recalculado.kilometros_odometro,"200.00");
        // Sin avance del odómetro o sin viajes no se calcula una desviación ficticia.
        await carga("01",0,10,true,{id_vehiculo:2});
        await carga("02",0,2,true,{id_vehiculo:2});
        await carga("03",100,5,true,{id_vehiculo:2});
        const otro = await req("/informes/consumo-combustible"+base+"&id_vehiculo=2");
        assert.equal(otro[0].estado_comparacion,"SIN_REFERENCIA_VIAJES");
        assert.equal(otro[0].consumo_real_galones_km,"0.050000");
        assert.equal(otro[0].desviacion_porcentaje,null);
        assert.equal(otro[1].estado_comparacion,"ODOMETRO_SIN_AVANCE");
        // Un abastecimiento dentro del horario de viaje impide comparar un recorrido incompleto.
        await carga("02",1025,2,true,{fecha_hora:"2026-10-02T08:30"});
        const cruzado = (await req("/informes/consumo-combustible"+base+"&id_vehiculo=1")).find(r=>r.fecha_fin==="2026-10-02T08:30:00");
        assert.equal(cruzado.estado_comparacion,"VIAJES_CRUZAN_LIMITES");
        assert.equal(cruzado.desviacion_porcentaje,null);
    } finally {
        if (server) await new Promise(resolve => server.close(resolve));
        pool.connect = connect; pool.query = query;
        await isolated.end();
        await admin.query("ROLLBACK");
        await admin.query("DROP SCHEMA IF EXISTS " + schema + " CASCADE");
        admin.release();
        await pool.end();
    }
});
