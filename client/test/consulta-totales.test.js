import test from 'node:test';
import assert from 'node:assert/strict';
import { totalesConsulta } from '../src/modules/informes/domain/consulta-totales.js';
test('Totales de viajes: importes decimales, margen negativo y conjunto vacío', () => {
 assert.deepEqual(totalesConsulta('viajes', [
  { ingreso_transporte:'80.00', costo_estimado_total:'34.00', margen_estimado:'46.00' },
  { ingreso_transporte:'64.00', costo_estimado_total:'34.00', margen_estimado:'30.00' },
  { ingreso_transporte:'96.00', costo_estimado_total:'57.50', margen_estimado:'38.50' }
 ]), { ingreso_transporte:240, costo_estimado_total:125.5, margen_estimado:114.5 });
 assert.equal(totalesConsulta('viajes',[{margen_estimado:'-0.10'},{margen_estimado:'0.30'}]).margen_estimado,0.2);
 assert.equal(totalesConsulta('viajes',[]).ingreso_transporte,0);
});
test('Cada consulta suma únicamente magnitudes aditivas', () => {
 assert.deepEqual(totalesConsulta('viaticos',[{estimado:'12',gasto_real_registrado:'6',diferencia:'-6'}]),{estimado:12,gasto_real_registrado:6,diferencia:-6});
 assert.deepEqual(totalesConsulta('consumo-combustible',[{galones_consumidos:'12.123456',consumo_real_galones_km:0.1},{galones_consumidos:null}]),{galones_consumidos:12.123456});
});
