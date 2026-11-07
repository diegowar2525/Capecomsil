import test from 'node:test';
import assert from 'node:assert/strict';
import { matriz, totales } from '../src/modules/produccion/domain/produccion.js';
test('Producción: matriz y totales preservan decimales, nulos y terminales faltantes',()=>{
 const rows=[{placa:'A',viajes:1,entregas:2,galones:'300',ingresos:'0.30',costo_estimado:null,margen_estimado:null,terminales:[{id_terminal:1,terminal:'T1',ingresos:'0.10'},{id_terminal:2,terminal:'T2',ingresos:'0.20'}]},
 {placa:'B',viajes:1,entregas:1,galones:'100',ingresos:'0.10',costo_estimado:null,margen_estimado:null,terminales:[{id_terminal:1,terminal:'T1',ingresos:'0.10'}]}];
 assert.equal(totales(rows).ingresos,0.4);
 assert.equal(totales(rows).costo_estimado,null);
 assert.equal(matriz(rows).rows[1].terminal_2,0);
 assert.equal(matriz(rows).terminales.length,2);
 assert.deepEqual(matriz([]),{terminales:[],rows:[]});
});
