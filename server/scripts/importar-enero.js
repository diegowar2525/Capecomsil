// Importador de ensayo: rechaza la base de la aplicación y nombres fuera del prefijo de pruebas.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const { validateData } = require('../src/utils/validators/documento_historico.validators');
const historicos = require('../src/models/documento_historico.model');
const liquidaciones = require('../src/models/liquidacion.model');
const detallesLiquidacion = require('../src/models/detalle_liquidacion.model');
const args = process.argv.slice(2);
const opt = key => args[args.indexOf(key)+1];
const destino = opt('--base');
if (!args.includes('--base') || !/^capecomsil_ensayo_enero_[a-z0-9_]+$/.test(destino) || destino === process.env.DB_NAME)
    throw new Error('Indique una base separada capecomsil_ensayo_enero_*');
if (!args.includes('--datos')) throw new Error('Falta --datos importacion.json');
const fichero = path.resolve(opt('--datos'));
const raw = fs.readFileSync(fichero);
const d = JSON.parse(raw);
assert.equal(d.fuente.sha256,'9a9169396cd4f390a69cc5b7e69113cd03235cdfec65020e224d4735ed8bab3f','Libro distinto del conciliado');
const hash = crypto.createHash('sha256').update(raw).digest('hex');
const config = {host:process.env.DB_HOST, port:process.env.DB_PORT || 5432, user:process.env.DB_USER, password:process.env.DB_PASSWORD};
const cent = v => Math.round(Number(v)*100);
const monto = v => (v/100).toFixed(2);
const mapas = {};
let c;
async function insertar(tabla, valores, pk) {
    const cols = Object.keys(valores);
    const r = await c.query(`INSERT INTO ${tabla}(${cols.join(',')}) VALUES(${cols.map((_,i)=>'$'+(i+1)).join(',')}) RETURNING ${pk}`,Object.values(valores));
    return r.rows[0][pk];
}
async function guardar(tabla, clave, valores, pk='id_'+tabla) {
    const id = await insertar(tabla,valores,pk);
    (mapas[tabla] ||= new Map()).set(clave,id);
    await c.query('INSERT INTO importacion_origen(clave,tabla,id_destino) VALUES($1,$2,$3)',[tabla+':'+clave,tabla,id]);
    return id;
}
const id = (tabla, clave) => {
    const n = mapas[tabla]?.get(clave);
    if (!n) throw new Error(`Referencia ausente ${tabla}: ${clave}`);
    return n;
};
async function documento(tipo, clave, data) {
    const v = validateData({ ...data, archivo_origen:d.fuente.archivo, huella_origen:d.fuente.sha256,
        fecha_corte:'2026-01-01'},tipo);
    const r = await (tipo==='CLIENTE'?historicos.createCliente:historicos.createProveedor)(c,v);
    const tabla=tipo==='CLIENTE'?'factura':'factura_proveedor', pk='id_'+tabla;
    (mapas[tabla] ||= new Map()).set(clave,r[pk]);
    await c.query('INSERT INTO importacion_origen(clave,tabla,id_destino) VALUES($1,$2,$3)',[tabla+':'+clave,tabla,r[pk]]);
    return r[pk];
}
async function facturaCadme(f, empresa) {
    const entregas=d.viajes.filter(v=>v.gasolinera==='CADME CORP' && v.estado==='REGISTRADO');
    assert.equal(entregas.length,1,'Cambió el conjunto de entregas Cadme');
    const v=entregas[0];
    assert.equal(String(v.fila),'111');
    assert.equal(v.fecha_inicio,'2026-01-11');
    assert.equal(Number(v.galones),10000);
    assert.equal(cent(v.transporte),35000);
    assert.equal(f.periodo_servicio,'ENERO*2026');
    assert.equal(cent(f.neto),34650);
    assert.equal(cent(f.retencion),350);
    const liq=await guardar('liquidacion','FACTURACION:12',{id_gasolinera:id('gasolinera','CADME CORP'),
        periodo_inicio:'2026-01-01',periodo_fin:'2026-01-31',
        observacion:'Reconstrucción durante la importación: FACTURACION!12 / RESPALDO FACTURA!28, factura 135; entrega TRANS!111. Las fechas de transición corresponden a la reconstrucción, no a eventos históricos documentados.'});
    const detalle=await detallesLiquidacion.create(c,liq,id('detalle_viaje','111'));
    await c.query('INSERT INTO importacion_origen VALUES($1,$2,$3)',['detalle_liquidacion:TRANS:111','detalle_liquidacion',detalle.id_detalle_liquidacion]);
    await liquidaciones.recalcularTotales(c,liq);
    for(const [anterior,nuevo,version] of [['BORRADOR','PREPARADA',2],['PREPARADA','CONFIRMADA',3]]) {
        await liquidaciones.cambiarEstado(c,liq,nuevo);
        await liquidaciones.registrarTransicion(c,liq,anterior,nuevo,null,version);
    }
    // Con entrega comprobada se usa el circuito normal. Los históricos sin entregas
    // no admiten asociaciones; no se desactivan sus restricciones para forzarlas.
    const factura=await guardar('factura',f.numero,{id_empresa:empresa,numero_factura:f.numero,
        fecha_emision:f.fecha_emision,subtotal:f.total_transporte,retencion:f.retencion,valor_neto:f.neto});
    await c.query('INSERT INTO factura_liquidacion(id_factura,id_liquidacion) VALUES($1,$2)',[factura,liq]);
    await c.query('INSERT INTO importacion_origen VALUES($1,$2,$3)',['factura:FACTURACION:12','factura',factura]);
    return factura;
}
async function cargar() {
    await c.query(`CREATE TABLE importacion_lote(hash text PRIMARY KEY, fuente text NOT NULL, completado boolean NOT NULL DEFAULT false);
        CREATE TABLE importacion_origen(clave text PRIMARY KEY, tabla text NOT NULL, id_destino integer NOT NULL);
        CREATE TABLE importacion_exclusion(datos jsonb NOT NULL);
        CREATE TABLE importacion_descuento_chofer(id_chofer integer REFERENCES chofer, id_pago_proveedor integer REFERENCES pago_proveedor,
            importe numeric(14,2) NOT NULL CHECK(importe>0), periodo_concepto text NOT NULL, fecha_aplicacion date, origen text UNIQUE NOT NULL,
            observacion text NOT NULL);`);
    await c.query('INSERT INTO importacion_lote(hash,fuente) VALUES($1,$2)',[hash,d.fuente.sha256]);
    for(const e of d.exclusiones_confirmadas) await c.query('INSERT INTO importacion_exclusion VALUES($1)',[JSON.stringify(e)]);
    for(const e of d.empresas_propuestas) {
        const clave=e.ruc || e.empresa_excel;
        if(!mapas.empresa?.has(clave)) await guardar('empresa',clave,{nombre:e.empresa_excel.includes('MAXIFUEL')?'MAXFUEL S.A.S':e.empresa_excel,ruc:e.ruc||null});
        await guardar('gasolinera',e.gasolinera,{nombre:e.gasolinera,id_empresa:id('empresa',clave),ruc:e.ruc||null,agente_retencion:e.agente_retencion==='SI'});
    }
    for(const t of new Set(d.viajes.map(v=>v.terminal))) await guardar('terminal',t,{nombre:t});
    const marca=await guardar('marca','SIN MARCA',{nombre:'SIN MARCA',ambito:'VEHICULO'});
    for(const v of d.vehiculos) await guardar('vehiculo',v.placa,{placa:v.placa,capacidad_galones:v.capacidad_galones,id_marca:marca,anio:2026});
    for(const ch of d.choferes) await guardar('chofer',ch.nombre,{nombre:ch.nombre,tipo_remuneracion:ch.tipo_remuneracion,fecha_inicio_trabajo:ch.fecha_inicio_trabajo});
    for(const p of new Set(d.viajes.map(v=>v.producto))) await guardar('producto_transportado',p,{nombre:p});
    const cfgV = await guardar('configuracion_viatico','enero',{importe_diario:'12',fecha_inicio:'2026-01-01',fecha_fin:'2026-01-31'});
    await guardar('configuracion_remuneracion','enero',{importe_diario:'34.51',adicional_dia_especial:0,fecha_inicio:'2026-01-01',fecha_fin:'2026-01-31',observacion:'Carga histórica; sin adicional documentado'});
    const cfgC = await guardar('configuracion_combustible','enero',{precio_por_galon:d.configuracion.precio_combustible,consumo_galones_km:d.configuracion.consumo_galones_km,fecha_inicio:'2026-01-01',fecha_fin:'2026-01-31'});
    for(const p of d.peajes_propuestos) {
        const v=d.viajes.find(v=>v.terminal===p.terminal && v.gasolinera===p.gasolinera);
        for(const vuelta of [false,true]) {
            const clave=p.terminal+'|'+p.gasolinera+'|'+vuelta;
            const trayecto=await guardar('trayecto',clave,{nombre:vuelta?p.gasolinera+' → '+p.terminal:p.terminal+' → '+p.gasolinera,
                id_terminal_origen:vuelta?null:id('terminal',p.terminal),id_gasolinera_origen:vuelta?id('gasolinera',p.gasolinera):null,
                id_terminal_destino:vuelta?id('terminal',p.terminal):null,id_gasolinera_destino:vuelta?null:id('gasolinera',p.gasolinera),kilometros:v.km_ida_propuesto});
            await guardar('configuracion_peaje_trayecto',clave,{id_trayecto:trayecto,importe:vuelta?p.peaje_vuelta:p.peaje_ida,fecha_inicio:'2026-01-01',fecha_fin:'2026-01-31'});
        }
    }
    for(const v of d.viajes) {
        const clave=v.terminal+'|'+v.gasolinera;
        if(!mapas.tarifa?.has(clave)) await guardar('tarifa',clave,{id_terminal:id('terminal',v.terminal),id_gasolinera:id('gasolinera',v.gasolinera),valor_por_galon:v.valor_por_galon,fecha_inicio:'2026-01-01',fecha_fin:'2026-01-31'});
        const viaje=await guardar('viaje',v.fila,{id_vehiculo:id('vehiculo',v.placa),id_chofer:id('chofer',v.chofer),fecha_inicio:v.fecha_inicio,estado:v.estado,motivo_anulacion:v.motivo_anulacion||null});
        for(const vuelta of [false,true]) {
            const k=clave+'|'+vuelta;
            await guardar('tramo_viaje',v.fila+'|'+vuelta,{id_viaje:viaje,id_trayecto:id('trayecto',k),id_configuracion_peaje_trayecto:id('configuracion_peaje_trayecto',k),peaje_aplicado:d.peajes_propuestos.find(p=>p.terminal===v.terminal && p.gasolinera===v.gasolinera)[vuelta?'peaje_vuelta':'peaje_ida'],orden:vuelta?2:1,kilometros:v.km_ida_propuesto});
        }
        // Conservar cantidades de viajes anulados sin volverlos entregas disponibles.
        await guardar('detalle_viaje',v.fila,{id_viaje:viaje,id_tarifa:id('tarifa',clave),id_producto_transportado:id('producto_transportado',v.producto),galones:v.galones,tarifa_aplicada:v.valor_por_galon,valor_transporte:v.transporte});
    }
    for(const ch of d.choferes) await c.query("SELECT recalcular_remuneracion($1,x::date) FROM generate_series('2026-01-01'::date,'2026-01-31'::date,interval '1 day') x",[id('chofer',ch.nombre)]);
    // Los desembolsos reales no reemplazan los costos estimados de los viajes.
    for(const v of d.viajes.filter(v=>v.estado==='REGISTRADO')) {
        const clave=v.chofer+'|'+v.fecha_inicio;
        if(!mapas.viatico_chofer?.has(clave)) await guardar('viatico_chofer',clave,{id_chofer:id('chofer',v.chofer),id_configuracion_viatico:cfgV,fecha:v.fecha_inicio,importe_diario_aplicado:12,total:12});
        const grupo=d.viajes.filter(x=>x.estado==='REGISTRADO' && x.chofer===v.chofer && x.fecha_inicio===v.fecha_inicio);
        const pos=grupo.indexOf(v), valor=(Math.floor(1200/grupo.length)+(pos<1200%grupo.length?1:0))/100;
        await guardar('costo_viaje','viatico:'+v.fila,{id_viaje:id('viaje',v.fila),tipo_costo:'VIATICO',valor,id_viatico_chofer:id('viatico_chofer',clave)},'id_costo');
        const peaje=d.peajes_propuestos.find(p=>p.terminal===v.terminal && p.gasolinera===v.gasolinera);
        await guardar('costo_viaje','peaje:'+v.fila,{id_viaje:id('viaje',v.fila),tipo_costo:'PEAJE',valor:Number(peaje.peaje_ida)+Number(peaje.peaje_vuelta)},'id_costo');
        if(Number(v.km_excel_prorrateado)>0) await guardar('costo_viaje','combustible:'+v.fila,{id_viaje:id('viaje',v.fila),tipo_costo:'COMBUSTIBLE',valor:v.combustible_estimado,id_configuracion_combustible:cfgC,kilometros_aplicados:v.km_excel_prorrateado,consumo_galones_km_aplicado:d.configuracion.consumo_galones_km,precio_por_galon_aplicado:d.configuracion.precio_combustible,galones_estimados:Number(v.km_excel_prorrateado)*Number(d.configuracion.consumo_galones_km)},'id_costo');
    }
    for(const e of d.gastos) {
        const partes=e.tipo==='VIATICO'?d.cobertura_viaticos.filter(x=>x.origen==='GASTO MECHITA!'+e.fila):[null];
        assert(partes.length>0,'Desembolso sin cobertura: '+e.fila);
        let suma=0;
        for(const [n,p] of partes.entries()) {
            const items=p?[['VIATICO',p.viatico],['PEAJE',p.peaje_desembolso]]:[[e.tipo==='DIESEL'?'COMBUSTIBLE':e.tipo,e.monto]];
            for(const [tipo,m] of items) {
                if(cent(m)===0) continue;
                suma+=cent(m);
                const origen=['VIATICO','COMBUSTIBLE'].includes(tipo)?tipo:'OPERATIVO';
                if(origen==='OPERATIVO' && !mapas.tipo_gasto?.has(tipo)) await guardar('tipo_gasto',tipo,{nombre:tipo,concepto_estimado:tipo==='PEAJE'?'PEAJE':null});
                let viatico=null;
                if(p && tipo==='VIATICO') {
                    const clave=e.responsable+'|'+p.dia_cubierto;
                    if(!mapas.viatico_chofer?.has(clave)) await guardar('viatico_chofer',clave,{id_chofer:id('chofer',e.responsable),id_configuracion_viatico:cfgV,fecha:p.dia_cubierto,importe_diario_aplicado:12,total:0});
                    viatico=id('viatico_chofer',clave);
                }
                await guardar('gasto',e.fila+':'+n+':'+tipo,{id_vehiculo:mapas.vehiculo.get(e.placa)||null,id_viatico_chofer:viatico,fecha:e.fecha,origen,id_tipo_gasto:origen==='OPERATIVO'?id('tipo_gasto',tipo):null,monto:m,numero_comprobante:e.comprobante,descripcion:e.observacion,observacion:'GASTO MECHITA!'+e.fila+(p?'; cobertura '+p.dia_cubierto:'')});
            }
        }
        assert.equal(suma,cent(e.monto));
    }
    const empresasFactura={'CADME CORP. SA.':'CADME CORP','PETROVEMA SA.':'RIO VERDE','PLUMAROL SA.':'ROCIO','MAXFUEL S.A.S':'1PETRILLO'};
    for(const f of d.facturas_clientes_revision) {
        const empresa=(await c.query('SELECT id_empresa FROM gasolinera WHERE id_gasolinera=$1',[id('gasolinera',empresasFactura[f.empresa.replace(/\s+/g,' ')])])).rows[0].id_empresa;
        const factura=f.numero==='135'?await facturaCadme(f,empresa):await documento('CLIENTE',f.numero,{id_empresa:empresa,numero_factura:f.numero,fecha_emision:f.fecha_emision,total:f.neto,retencion:f.retencion,hoja_origen:'FACTURACION',fila_origen:Number(f.origen.split('!')[1])});
        if(cent(f.cobrado)>0 && f.fecha_cobro.startsWith('2026-01')) await guardar('pago',f.numero,{id_factura:factura,fecha_pago:f.fecha_cobro,monto:f.cobrado,forma_pago:f.forma_pago,banco:f.banco||null,numero_comprobante:f.comprobante});
    }
    const enero=d.pagos_proveedores_revision.filter(p=>p.periodo==='ENERO');
    const alias={'OSWALDO VIZCARRA':'O.V.S LLANTAS','JAVIER ESPINOZA':'COMERCIALIZADORA ESPINOZA'};
    const grupos=new Map();
    for(const p of enero) {
        const proveedor=alias[p.proveedor]||p.proveedor, numero=p.documento.replace(/\D/g,'');
        const clave=proveedor+'|'+numero;
        if(!grupos.has(clave)) grupos.set(clave,[]);
        grupos.get(clave).push({...p,proveedor,numero});
    }
    for(const [clave,grupo] of grupos) {
        const p=grupo[0];
        if(!mapas.proveedor?.has(p.proveedor)) await guardar('proveedor',p.proveedor,{nombre:p.proveedor});
        const previo=p.proveedor==='DURALLANTA SA'?monto(cent(p.total_original)-cent(p.saldo_excel)):'0';
        const factura=await documento('PROVEEDOR',clave,{id_proveedor:id('proveedor',p.proveedor),numero_factura:p.numero,fecha_emision:p.fecha_emision,total:p.total_original,importe_pagado_previo:previo,hoja_origen:'CHEQUES',fila_origen:p.fila});
        for(const pago of grupo) {
            const pid=await guardar('pago_proveedor',pago.origen,{id_factura_proveedor:factura,fecha_pago:pago.fecha_pago,monto:pago.importe,forma_pago:pago.cheque && pago.cheque!=='0'?'CHEQUE':null,numero_cheque:pago.cheque==='0'?null:pago.cheque,numero_comprobante:pago.documento,observacion:pago.concepto});
            if(pago.estado==='PAGO_IESS_DESCUENTO_CHOFER_NO_GASTO_ADICIONAL') await c.query(`INSERT INTO importacion_descuento_chofer VALUES($1,$2,$3,'2025-12',NULL,$4,$5)`,[id('chofer','AREVALO'),pid,pago.importe,pago.origen,'Descuento del neto; no reducir remuneración bruta ni generar otro gasto. Fecha de aplicación no documentada.']);
        }
    }
    await c.query('SET CONSTRAINTS ALL IMMEDIATE');
    await c.query('UPDATE importacion_lote SET completado=true WHERE hash=$1',[hash]);
}
async function verificar() {
    const q=async sql=>(await c.query(sql)).rows;
    const viajes=await q(`SELECT estado,count(*)::int cantidad,sum(galones)::text galones,sum(valor_transporte)::text transporte FROM viaje JOIN detalle_viaje USING(id_viaje) GROUP BY estado ORDER BY estado`);
    assert.equal(viajes.find(x=>x.estado==='REGISTRADO').cantidad,318);
    assert.equal(viajes.find(x=>x.estado==='ANULADO').cantidad,9);
    assert.equal(Number(viajes.find(x=>x.estado==='REGISTRADO').galones),1085000);
    assert.equal(Number(viajes.find(x=>x.estado==='REGISTRADO').transporte),25592);
    const gastos=await q('SELECT sum(monto)::text total FROM gasto');
    assert.equal(Number(gastos[0].total),7283.71);
    const saldos=await q(`SELECT numero_factura,total,importe_pagado_previo,total-importe_pagado_previo-COALESCE((SELECT sum(monto) FROM pago_proveedor p WHERE p.id_factura_proveedor=f.id_factura_proveedor),0) saldo FROM factura_proveedor f ORDER BY numero_factura`);
    const cuentas=await q('SELECT count(*)::int cantidad,sum(valor_neto)::text total FROM factura');
    const remuneraciones=await q('SELECT count(*)::int dias,sum(total)::text total FROM remuneracion_chofer');
    const efectivo=await q('SELECT sum(monto)::text total FROM pago_proveedor');
    const cobros=await q('SELECT sum(monto)::text total FROM pago');
    assert.equal(Number(cobros[0].total),15335.5);
    assert.equal(Number(efectivo[0].total),6452.19);
    assert.equal(saldos.reduce((s,f)=>s+cent(f.saldo),0),229285);
    assert.equal(saldos.reduce((s,f)=>s+cent(f.importe_pagado_previo),0),63883);
    let esperadoRemuneracion=0;
    for(const ch of d.choferes) for(let dia=1;dia<=31;dia++) {
        const fecha='2026-01-'+String(dia).padStart(2,'0');
        const trabajado=d.viajes.some(v=>v.estado==='REGISTRADO' && v.chofer===ch.nombre && v.fecha_inicio===fecha);
        if(trabajado || (ch.tipo_remuneracion==='DIARIO_FIJO' && new Date(fecha+'T12:00:00Z').getUTCDay()!==0)) esperadoRemuneracion+=3451;
    }
    assert.equal(cent(remuneraciones[0].total),esperadoRemuneracion);
    assert.equal(remuneraciones[0].dias,217);
    assert.equal(Number((await q("SELECT COALESCE(sum(valor),0) total FROM costo_viaje JOIN viaje USING(id_viaje) WHERE estado='ANULADO'"))[0].total),0);
    assert.equal(Number((await q("SELECT sum(monto) total FROM gasto WHERE origen='COMBUSTIBLE'"))[0].total),4679.62);
    assert.equal(Number((await q('SELECT count(*) n FROM abastecimiento_combustible'))[0].n),0);
    assert.equal(Number((await q('SELECT count(*) n FROM factura_liquidacion'))[0].n),1);
    const cadme=(await q(`SELECT f.numero_factura,f.historico,l.id_liquidacion,l.id_gasolinera,l.estado,l.total_galones,l.valor_transporte,l.retencion,l.total_liquidacion,dl.id_detalle_viaje
        FROM factura f JOIN factura_liquidacion fl USING(id_factura) JOIN liquidacion l USING(id_liquidacion)
        JOIN detalle_liquidacion dl USING(id_liquidacion) WHERE f.numero_factura='135'`));
    assert.equal(cadme.length,1);
    const liq=cadme[0];
    assert.equal(liq.historico,false); assert.equal(liq.estado,'CONFIRMADA');
    assert.equal(Number(liq.total_galones),10000); assert.equal(cent(liq.total_liquidacion),34650);
    assert.equal((await detallesLiquidacion.findDisponibles({id_gasolinera:liq.id_gasolinera,periodo_inicio:'2026-01-01',periodo_fin:'2026-01-31'},c)).length,0);
    // Intento real de reutilizar la entrega: rollback al savepoint incluso si la prueba falla.
    await c.query('SAVEPOINT prueba_entrega_ocupada');
    try {
        const otro=await liquidaciones.create(c,{id_gasolinera:liq.id_gasolinera,periodo_inicio:'2026-01-01',periodo_fin:'2026-01-31',recargos:[],observacion:'Prueba que se revierte'});
        await assert.rejects(detallesLiquidacion.create(c,otro.id_liquidacion,liq.id_detalle_viaje),{code:'23514',constraint:'liquidacion_entrega_ocupada'});
    } finally { await c.query('ROLLBACK TO SAVEPOINT prueba_entrega_ocupada'); await c.query('RELEASE SAVEPOINT prueba_entrega_ocupada'); }
    assert.equal(Number((await q('SELECT COALESCE(sum(importe),0) total FROM importacion_descuento_chofer'))[0].total),0);
    const conteosReales=[];
    for(const tabla of ['viaje','detalle_viaje','tramo_viaje','costo_viaje','remuneracion_chofer','gasto','factura','pago','factura_proveedor','pago_proveedor','viatico_chofer','importacion_origen','liquidacion','detalle_liquidacion','factura_liquidacion']) {
        conteosReales.push({tabla,cantidad:Number((await q(`SELECT count(*) n FROM ${tabla}`))[0].n)});
    }
    const conteos=await q(`SELECT tabla,count(*)::int cantidad FROM importacion_origen GROUP BY tabla ORDER BY tabla`);
    return {base:destino,fuente:d.fuente,viajes,gastos,saldos,cuentas,remuneraciones,pagos_proveedores:efectivo,cobros,conteos,conteos_reales:conteosReales,cadme,
        entrega_cadme_bloqueada:true,descuento_arevalo_aplicado:false,
        limitaciones:['AREVALO sin descuento salarial; pago histórico IESS conservado.','Solo movimientos financieros pagados en enero; pagos posteriores no cargados.']};
}
async function main() {
    const admin=new Client({...config,database:'postgres'});
    await admin.connect();
    try {
        const existe=(await admin.query('SELECT 1 FROM pg_database WHERE datname=$1',[destino])).rowCount;
        if(!existe) {
            if(!args.includes('--crear')) throw new Error('La base no existe; indique --crear para crearla');
            await admin.query(`CREATE DATABASE "${destino}"`);
        }
    } finally {await admin.end();}
    c=new Client({...config,database:destino}); await c.connect();
    try {
        await c.query('BEGIN');
        await c.query('SELECT pg_advisory_xact_lock(72631,1)');
        const tablas=Number((await c.query("SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'")).rows[0].count);
        let repetida=false;
        if(tablas===0) {
            await c.query(fs.readFileSync(path.join(__dirname,'../../database/schema.sql'),'utf8'));
            await cargar();
        } else {
            const existe=(await c.query("SELECT to_regclass('public.importacion_lote') tabla")).rows[0].tabla;
            if(!existe) throw new Error('Base no vacía y sin lote reconocido: no se modifica');
            const lote=(await c.query('SELECT * FROM importacion_lote')).rows;
            assert.equal(lote.length,1); assert.equal(lote[0].hash,hash,'El paquete cambió'); assert.equal(lote[0].completado,true);
            repetida=true;
        }
        const informe=await verificar();
        const informePath=path.join(path.dirname(fichero),'RESULTADO_IMPORTACION.json');
        if(repetida && fs.existsSync(informePath)) {
            const anterior=JSON.parse(fs.readFileSync(informePath));
            if(anterior.base===destino && anterior.conteos_reales) assert.deepEqual(informe.conteos_reales,anterior.conteos_reales,'Los conteos cambiaron');
        }
        await c.query('COMMIT');
        informe.repeticion_sin_inserciones=repetida;
        fs.writeFileSync(path.join(path.dirname(fichero),'RESULTADO_IMPORTACION.json'),JSON.stringify(informe,null,2));
        console.log(JSON.stringify(informe,null,2));
    } catch(e) {await c.query('ROLLBACK'); throw e;} finally {await c.end();}
}
main().catch(e=>{console.error(e.message || e.code || 'Conexión fallida', e.constraint||'',e.detail||'');process.exitCode=1;});
