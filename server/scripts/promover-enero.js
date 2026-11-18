// Reemplazo explícito autorizado de la base ficticia. No genera respaldo.
// Primero clona y comprueba el ensayo; solo entonces elimina el destino.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {Client} = require('pg');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
const origen='capecomsil_ensayo_enero_20261117';
const destino='capecomsildb';
const temporal='capecomsil_carga_enero_20261117';
const carpeta=path.resolve(__dirname,'../../.local-migracion/enero-2026-sin-descuento');
const config={host:process.env.DB_HOST,port:process.env.DB_PORT||5432,user:process.env.DB_USER,password:process.env.DB_PASSWORD};
const quote = nombre => '"'+nombre.replaceAll('"','""')+'"';
assert.equal(process.env.DB_NAME,destino,'DB_NAME debe ser capecomsildb');
assert(['localhost','127.0.0.1','::1'].includes(config.host),'Solo se permite el servidor local revisado');
const paquete=fs.readFileSync(path.join(carpeta,'importacion.json'));
const hash=crypto.createHash('sha256').update(paquete).digest('hex');
const esperado=JSON.parse(fs.readFileSync(path.join(carpeta,'RESULTADO_IMPORTACION.json')));
assert.equal(esperado.base,origen);
assert.equal(esperado.entrega_cadme_bloqueada,true);
assert.equal(esperado.descuento_arevalo_aplicado,false);
assert.equal(esperado.repeticion_sin_inserciones,true);
async function revisar(base) {
    const c=new Client({...config,database:base}); await c.connect();
    try {
        await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
        const lote=(await c.query('SELECT * FROM importacion_lote')).rows;
        assert.equal(lote.length,1); assert.equal(lote[0].hash,hash); assert.equal(lote[0].completado,true);
        for(const t of esperado.conteos_reales) {
            assert.equal(Number((await c.query(`SELECT count(*) n FROM ${quote(t.tabla)}`)).rows[0].n),t.cantidad,t.tabla);
        }
        assert.equal(Number((await c.query('SELECT count(*) n FROM usuario')).rows[0].n),0);
        assert.equal(Number((await c.query('SELECT count(*) n FROM importacion_descuento_chofer')).rows[0].n),0);
        const resumen=(await c.query(`SELECT
            (SELECT count(*) FROM viaje WHERE estado='REGISTRADO')::int viajes,
            (SELECT count(*) FROM viaje WHERE estado='ANULADO')::int anulados,
            (SELECT sum(d.galones) FROM detalle_viaje d JOIN viaje v USING(id_viaje) WHERE v.estado='REGISTRADO') galones,
            (SELECT sum(d.valor_transporte) FROM detalle_viaje d JOIN viaje v USING(id_viaje) WHERE v.estado='REGISTRADO') transporte,
            (SELECT sum(monto) FROM gasto) gastos,
            (SELECT sum(total) FROM remuneracion_chofer) remuneraciones,
            (SELECT sum(monto) FROM pago) cobros,
            (SELECT sum(monto) FROM pago_proveedor) pagos_proveedores`)).rows[0];
        assert.equal(resumen.viajes,318); assert.equal(resumen.anulados,9);
        for(const [k,v] of Object.entries({galones:1085000,transporte:25592,gastos:7283.71,remuneraciones:6039.25,cobros:15335.5,pagos_proveedores:6452.19})) assert.equal(Number(resumen[k]),v,k);
        const tablas=(await c.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows;
        const huellas=[];
        for(const {tablename} of tablas) {
            const r=(await c.query(`SELECT count(*)::int cantidad,md5(COALESCE(string_agg(fila,E'\\n' ORDER BY fila),'')) huella FROM (SELECT row_to_json(t)::text fila FROM public.${quote(tablename)} t) x`)).rows[0];
            huellas.push({tabla:tablename,...r});
        }
        const secuencias=(await c.query("SELECT sequencename,last_value FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename")).rows;
        await c.query('COMMIT');
        return {resumen,huellas,secuencias};
    } finally {await c.end();}
}
async function main() {
    const a=new Client({...config,database:'postgres'}); await a.connect();
    let destinoBloqueado=false,eliminado=false;
    try {
        const info=(await a.query(`SELECT datname,pg_get_userbyid(datdba) propietario,datallowconn FROM pg_database WHERE datname=ANY($1::text[])`,[[origen,destino,temporal]])).rows;
        const anterior=info.find(x=>x.datname===destino);
        assert(anterior,'La base destino debe existir antes del reemplazo');
        assert(info.find(x=>x.datname===origen));
        assert(!info.find(x=>x.datname===temporal),'Ya existe la base temporal; revisar antes de continuar');
        const fuente=await revisar(origen);
        const preflight={origen,destino,temporal,sin_respaldo:true,fuente:fuente.resumen};
        if(!process.argv.includes('--aplicar-reemplazo-autorizado')) {console.log(JSON.stringify(preflight,null,2)); return;}
        // Evita sesiones nuevas durante la copia física. Restaurar siempre el acceso al ensayo.
        await a.query(`ALTER DATABASE ${quote(origen)} ALLOW_CONNECTIONS false`);
        try {
            await a.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1 AND pid<>pg_backend_pid()',[origen]);
            await a.query(`CREATE DATABASE ${quote(temporal)} WITH TEMPLATE ${quote(origen)} OWNER ${quote(anterior.propietario)}`);
        } finally {await a.query(`ALTER DATABASE ${quote(origen)} ALLOW_CONNECTIONS true`);}
        await a.query(`ALTER DATABASE ${quote(temporal)} ALLOW_CONNECTIONS true`);
        assert.deepEqual(await revisar(temporal),fuente,'La copia no coincide con el ensayo');
        // No se borra el destino hasta que una copia independiente ha pasado la conciliación.
        await a.query(`ALTER DATABASE ${quote(destino)} ALLOW_CONNECTIONS false`); destinoBloqueado=true;
        await a.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1 AND pid<>pg_backend_pid()',[destino]);
        await a.query(`DROP DATABASE ${quote(destino)}`); eliminado=true;
        await a.query(`ALTER DATABASE ${quote(temporal)} RENAME TO ${quote(destino)}`);
        destinoBloqueado=false;
        const final=await revisar(destino);
        assert.deepEqual(final,fuente,'La base definitiva no coincide con el ensayo');
        const resultado={...preflight,completado:true,fecha:new Date().toISOString(),tablas_verificadas:final.huellas.length,usuarios:0,...final};
        fs.writeFileSync(path.join(carpeta,'RESULTADO_REEMPLAZO.json'),JSON.stringify(resultado,null,2));
        console.log(JSON.stringify({destino,completado:true,sin_respaldo:true,usuarios:0,tablas_verificadas:final.huellas.length,resumen:final.resumen},null,2));
    } catch(e) {
        if(destinoBloqueado && !eliminado) await a.query(`ALTER DATABASE ${quote(destino)} ALLOW_CONNECTIONS true`);
        throw e;
    } finally {await a.end();}
}
main().catch(e=>{console.error(e.message||e.code||'Error al reemplazar base'); process.exitCode=1;});
