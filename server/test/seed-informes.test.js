const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const pool = require("../src/config/database");
const informes = require("../src/services/informes.service");

test("Seed: escenario económico reproducible y consumo entre cargas completas", async () => {
    const client = await pool.connect();
    const originalQuery = pool.query;
    try {
        await client.query("BEGIN");
        await client.query(`CREATE SCHEMA test_seed_informes_${process.pid}`);
        await client.query(`SET LOCAL search_path TO test_seed_informes_${process.pid},public`);
        await client.query(fs.readFileSync(path.join(__dirname,"../../database/schema.sql"),"utf8"));
        await client.query(fs.readFileSync(path.join(__dirname,"../../database/seed.sql"),"utf8")
            .replace(/^BEGIN;/m,"").replace(/^COMMIT;/m,""));
        await client.query("SET CONSTRAINTS ALL IMMEDIATE");
        pool.query = client.query.bind(client);
        const filtros = {fecha_desde:"2026-10-01",fecha_hasta:"2026-10-31"};
        const resumen = await informes.getResumen(filtros);
        assert.equal(resumen.cantidad_viajes,3);
        assert.equal(resumen.ingreso_transporte,"240.00");
        assert.equal(resumen.costo_estimado_viajes,"125.50");
        assert.equal(resumen.margen_estimado_viajes,"114.50");
        assert.equal(resumen.gastos_registrados_periodo,"150.29");
        assert.equal(resumen.gastos_de_viajes_anulados,"4.00");
        assert.equal(resumen.remuneracion_generada_sin_viajes,"70.00");
        assert.equal(resumen.gastos_sin_vehiculo,"39.00");
        const viajes = await informes.getViajes(filtros);
        assert.equal(viajes.length,3);
        assert.equal(viajes.filter(v=>v.fecha_inicio.startsWith("2026-10-05")).length,2);
        for (const v of viajes.filter(v=>v.fecha_inicio.startsWith("2026-10-05"))) {
            assert.equal(v.chofer_estimado,"17.50");
            assert.equal(v.viatico_estimado,"6.00");
            assert.equal(v.combustible_estimado,"10.50");
        }
        assert.equal(viajes.filter(v=>v.peaje_real_registrado===null).length,1);
        const diarios = await informes.getViaticos(filtros);
        assert.equal(diarios.find(d=>d.fecha==="2026-10-05").diferencia,"2.00");
        assert.equal(diarios.find(d=>d.fecha==="2026-10-06").gasto_real_registrado,null);
        const cargas = await informes.getCombustible(filtros);
        assert.equal(cargas.length,2);
        assert.equal(cargas[0].estado_comparacion,"COMPARABLE");
        assert.equal(cargas[0].kilometros_odometro,"66.00");
        assert.equal(cargas[0].galones_consumidos,"12.0000");
        assert.equal(cargas[0].importe_comprado_intervalo,"37.23");
        assert.equal(cargas[0].galones_estimados_viajes,"10.150800");
        assert.equal(cargas[0].consumo_referencia_galones_km,"0.153800");
        assert.equal(cargas[0].desviacion_porcentaje,"18.22");
        assert.equal(cargas[1].estado_comparacion,"SIN_CARGA_INICIAL");
        assert.equal((await client.query("SELECT count(*)::int n FROM gasto WHERE estado='ANULADO'")).rows[0].n,1);
    } finally {
        pool.query = originalQuery;
        await client.query("ROLLBACK");
        client.release();
        await pool.end();
    }
});
