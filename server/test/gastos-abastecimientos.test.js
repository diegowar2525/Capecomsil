const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

test("Gastos y cargas: decimal, referencias, rollback, odómetro y anulaciones concurrentes", async () => {
    const pool = require("../src/config/database");
    const connect = pool.connect, query = pool.query;
    const admin = await pool.connect();
    const schema = "gastos_test_" + process.pid;
    const isolated = new Pool({ ...pool.options, password: pool.options.password, options: "-c search_path=" + schema + ",public" });
    let server;
    try {
        await admin.query("BEGIN");
        await admin.query("CREATE SCHEMA " + schema);
        await admin.query("SET LOCAL search_path TO " + schema + ",public");
        await admin.query(fs.readFileSync(path.join(__dirname,"../../database/schema.sql"),"utf8"));
        await admin.query(`INSERT INTO vehiculo(placa,capacidad_galones) VALUES ('G1',100),('G2',100);
            INSERT INTO chofer(nombre,cedula,tipo_remuneracion) VALUES ('C','C','DIARIO_FIJO');
            INSERT INTO configuracion_viatico(importe_diario,fecha_inicio) VALUES (12,'2026-01-01');
            INSERT INTO viatico_chofer(id_chofer,id_configuracion_viatico,fecha,importe_diario_aplicado,total)
            VALUES (1,1,'2026-10-01',12,12);
            INSERT INTO terminal(nombre) VALUES ('T'); INSERT INTO gasolinera(nombre) VALUES ('G');
            INSERT INTO producto_transportado(nombre,unidad_medida) VALUES ('Diesel','galón');
            INSERT INTO tarifa(id_gasolinera,id_terminal,valor_por_galon,fecha_inicio) VALUES (1,1,0.04,'2026-01-01');
            INSERT INTO configuracion_remuneracion(importe_diario,adicional_dia_especial,fecha_inicio) VALUES (35,35,'2026-01-01');
            INSERT INTO configuracion_combustible(consumo_galones_km,precio_por_galon,fecha_inicio) VALUES (0.1,3,'2026-01-01');
            INSERT INTO trayecto(nombre,id_terminal_origen,id_gasolinera_destino,kilometros) VALUES ('T-G',1,1,50);
            INSERT INTO configuracion_peaje_trayecto(id_trayecto,importe,fecha_inicio) VALUES (1,0,'2026-01-01');`);
        await admin.query("COMMIT");
        pool.connect = isolated.connect.bind(isolated); pool.query = isolated.query.bind(isolated);
        server = require("../src/app").listen(0,"127.0.0.1");
        await new Promise(resolve => server.once("listening",resolve));
        const req = async (route,method="GET",body) => {
            const r = await fetch(`http://127.0.0.1:${server.address().port}/api${route}`,{
                method,headers:{"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)
            });
            return {status:r.status,body:await r.json()};
        };
        const gasto = {fecha:"2026-10-01",tipo_gasto:"comida",monto:"12.00",descripcion:"Comida"};
        const g = await req("/gastos","POST",gasto);
        assert.equal(g.status,201,JSON.stringify(g));
        assert.equal(g.body.id_vehiculo,null);
        assert.equal(g.body.tipo_gasto,"COMIDA");
        assert.equal(g.body.fecha,"2026-10-01");
        for (const patch of [{monto:0},{fecha:"2026-02-30"},{id_vehiculo:999},{id_proveedor:999},
            {id_viaje:999},{tipo_gasto:"COMBUSTIBLE"},{id_viatico_chofer:1},{tipo_gasto:"VIATICO",id_viatico_chofer:999}]) {
            assert.equal((await req("/gastos","POST",{...gasto,...patch})).status,400,JSON.stringify(patch));
        }
        const viatico = await req("/gastos","POST",{...gasto,tipo_gasto:"VIATICO",id_viatico_chofer:1});
        assert.equal(viatico.status,201,JSON.stringify(viatico));
        const viaje = await req("/viajes","POST",{id_vehiculo:1,id_chofer:1,
            fecha_inicio:"2026-10-03T08:00",fecha_fin:"2026-10-03T09:00",
            tramos:[{orden:1,id_trayecto:1}],detalles:[{id_terminal:1,id_gasolinera:1,id_producto_transportado:1,galones:"50"}]});
        assert.equal(viaje.status,201,JSON.stringify(viaje));
        const idViaje = viaje.body.id_viaje;
        assert.equal((await req("/gastos","POST",{...gasto,id_viaje:idViaje,id_vehiculo:2})).status,400);
        const peaje = await req("/gastos","POST",{...gasto,tipo_gasto:"PEAJE",id_viaje:idViaje});
        assert.equal(peaje.status,201,JSON.stringify(peaje));
        assert.equal(peaje.body.id_vehiculo,1);
        assert.equal((await req(`/gastos?id_viaje=${idViaje}`)).body.length,1);
        assert.equal((await req(`/viajes/${idViaje}/anular`,"POST",{motivo:"Corrección"})).status,200);
        assert.equal((await req("/gastos","POST",{...gasto,id_viaje:idViaje})).status,409);
        assert.equal((await req(`/gastos/${peaje.body.id_gasto}`)).body.estado,"REGISTRADO");
        const carga = {id_vehiculo:1,fecha_hora:"2026-10-02T08:00:00",kilometraje_odometro:"1000",
            galones:"10.1234",precio_por_galon:"3.1234",tanque_lleno:true,numero_comprobante:"F-001"};
        const ruta = "/abastecimientos-combustible";
        const a = await req(ruta,"POST",carga);
        assert.equal(a.status,201,JSON.stringify(a));
        assert.equal(a.body.monto,"31.62");
        assert.equal(a.body.fecha_hora,carga.fecha_hora);
        const gastoCarga = (await req(`/gastos/${a.body.id_gasto}`)).body;
        assert.equal(gastoCarga.id_abastecimiento_combustible,a.body.id_abastecimiento_combustible);
        assert.equal(gastoCarga.monto,a.body.monto);
        assert.equal(gastoCarga.fecha,"2026-10-02");
        assert.equal(gastoCarga.numero_comprobante,"F-001");
        for (const patch of [{tanque_lleno:"true"},{galones:0},{kilometraje_odometro:-1},{id_vehiculo:999},
            {monto:1},{id_gasto:1},{galones:"99999999",precio_por_galon:"99999999",id_vehiculo:2},
            {galones:"0.0001",precio_por_galon:"0.0001",id_vehiculo:2}]) {
            assert.equal((await req(ruta,"POST",{...carga,...patch})).status,400,JSON.stringify(patch));
        }
        // El orden del odómetro se controla en ambos sentidos para altas retroactivas.
        for (const patch of [{fecha_hora:"2026-10-01T08:00",kilometraje_odometro:1001},
            {fecha_hora:"2026-10-03T08:00",kilometraje_odometro:999},{}]) {
            assert.equal((await req(ruta,"POST",{...carga,...patch})).status,409);
        }
        assert.equal((await req(ruta,"POST",{...carga,fecha_hora:"2026-10-01T08:00",kilometraje_odometro:900,tanque_lleno:false})).status,201);
        const counts = async () => (await isolated.query("SELECT (SELECT count(*)::int FROM gasto) gastos,(SELECT count(*)::int FROM abastecimiento_combustible) cargas")).rows[0];
        const antes = await counts();
        // Simula un error después del INSERT de gasto: ninguno de los dos debe quedar guardado.
        const modelo = require("../src/models/abastecimiento_combustible.model");
        const create = modelo.create;
        try {
            modelo.create = async () => { throw new Error("Fallo simulado al guardar carga"); };
            assert.equal((await req(ruta,"POST",{...carga,id_vehiculo:2})).status,500);
        } finally { modelo.create = create; }
        assert.deepEqual(await counts(),antes);
        const simultaneas = await Promise.all([1,2].map(() => req(ruta,"POST",{...carga,id_vehiculo:2})));
        assert.deepEqual(simultaneas.map(r=>r.status).sort(),[201,409]);
        assert.equal((await req(ruta+"?id_vehiculo=1&fecha_desde=2026-10-02&fecha_hasta=2026-10-02")).body.length,1);
        assert.equal((await req("/gastos?tipo_gasto=VIATICO&id_viatico_chofer=1")).body.length,1);
        for (const q of ["?limit=201","?offset=-1","?estado=ACTIVO","?fecha_desde=2026-10-03&fecha_hasta=2026-10-01"]) {
            assert.equal((await req(ruta+q)).status,400);
        }
        assert.equal((await req(ruta+"/999")).status,404);
        assert.equal((await req("/gastos/999/anular","POST",{motivo:"Error"})).status,404);
        assert.equal((await req(ruta+`/${a.body.id_abastecimiento_combustible}/anular`,"POST",{})).status,400);
        const anuladas = await Promise.all([
            req(`/gastos/${a.body.id_gasto}/anular`,"POST",{motivo:"Corrección"}),
            req(`${ruta}/${a.body.id_abastecimiento_combustible}/anular`,"POST",{motivo:"Corrección"})
        ]);
        assert.deepEqual(anuladas.map(r=>r.status).sort(),[200,409]);
        assert.equal((await req(`${ruta}/${a.body.id_abastecimiento_combustible}`)).body.estado,"ANULADO");
        assert.equal((await req(`/gastos/${a.body.id_gasto}`)).body.estado,"ANULADO");
        assert.equal((await req(ruta+"?id_vehiculo=1&estado=ANULADO")).body.length,1);
        assert.equal((await req(ruta,"POST",carga)).status,201); // Reemplazar una carga anulada.
        assert.equal((await req(`/gastos/${g.body.id_gasto}/anular`,"POST",{motivo:"Duplicado"})).status,200);
        assert.equal((await req(`/gastos/${g.body.id_gasto}/anular`,"POST",{motivo:"Duplicado"})).status,409);
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
