import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { prepararCampos, valoresIniciales } from '../src/domain/catalogo.js';
import { listarPaginas } from '../src/services/consultas.api.js';
const require = createRequire(import.meta.url);
const facturaValidator = require('../../server/src/utils/validators/factura_proveedor.validators.js');
const liquidacionValidator = require('../../server/src/utils/validators/liquidacion.validators.js');

test('Factura: las filas y la recepción condicional respetan el contrato real del backend', async () => {
 const { fields } = await import('../src/modules/facturas-proveedores/facturas-proveedores.fields.js');
 const { prepare } = await import('../src/modules/facturas-proveedores/domain/facturas-proveedores.js');
 const values = valoresIniciales(fields, { id_proveedor:1,numero_factura:'TEST',fecha_emision:'2026-10-26',detalles:[{tipo_concepto:'SERVICIO',id_producto:7,descripcion:'Reparación',cantidad:'1',precio_unitario:'10',descuento:'0',porcentaje_impuesto:'0'}] });
 const data = prepare(values);
 assert.equal('recepcion_inicial' in data,false);
 assert.equal('incluir_recepcion_inicial' in data,false);
 assert.equal('id_producto' in data.detalles[0],false);
 assert.equal(facturaValidator.validateData(data).detalles[0].precio_unitario,'10');
 values.incluir_recepcion_inicial=true;
 assert.throws(()=>prepare(values));
});

test('Liquidaciones: edición y transiciones conservan versión y selección explícita', async () => {
 const { prepare, prepareAction } = await import('../src/modules/liquidaciones/domain/liquidaciones.js');
 const { actions } = await import('../src/modules/liquidaciones/liquidaciones.actions.js');
 const edit=actions.find(action=>action.id==='edit');
 const data=prepare({id_gasolinera:'1',periodo_inicio:'2026-10-01',periodo_fin:'2026-10-31',id_detalles_viaje:['2'],observacion:''},{},{version:3},edit);
 assert.deepEqual(liquidacionValidator.validateEdicion(data).id_detalles_viaje,[2]);
 assert.equal(data.version,3);
 const send=prepareAction(actions.find(action=>action.id==='send'),{},{version:3});
 assert.equal(liquidacionValidator.validateTransicion(send).version,3);
 const auto=prepare({id_gasolinera:'1',periodo_inicio:'2026-10-01',periodo_fin:'2026-10-31',seleccion_entregas:'AUTOMATICA',id_detalles_viaje:['8']},{},null,{id:'create'});
 assert.equal('id_detalles_viaje' in auto,false);
 assert.equal(liquidacionValidator.validateCreacion(auto).id_detalles_viaje,null);
});

test('Listados paginados: consulta todas las páginas y conserva los filtros', async () => {
 const original=globalThis.fetch; const calls=[];
 globalThis.fetch=async path=>{calls.push(path);const offset=Number(new URL(path,'http://test').searchParams.get('offset'));return Response.json(offset===0?Array.from({length:200},(_,id)=>({id})): [{id:200}]);};
 try { const rows=await listarPaginas('/api/inventario/movimientos',{fecha_desde:'2026-10-01',id_producto:null}); assert.equal(rows.length,201);assert.equal(calls.length,2);assert.match(calls[1],/offset=200/);assert.ok(!calls[0].includes('id_producto')); } finally {globalThis.fetch=original;}
});

test('Operaciones: rutas de envío, borrado con versión, recepción y generación', async () => {
 const original=globalThis.fetch;const calls=[];
 globalThis.fetch=async (path,options)=>{calls.push({path,...options});return Response.json({});};
 try {
  const {api:l}=await import('../src/modules/liquidaciones/services/liquidaciones.api.js');
  await l.eliminar(1,{version:4});assert.equal(calls.at(-1).body,'{"version":4}');assert.equal(calls.at(-1).method,'DELETE');
  await l.ejecutar('send',1,{version:4});assert.equal(calls.at(-1).path,'/api/liquidaciones/1/enviar');
  const {api:f}=await import('../src/modules/facturas-proveedores/services/facturas-proveedores.api.js');
  await f.ejecutar('receive',2,{detalles:[]});assert.equal(calls.at(-1).path,'/api/recepciones-compra');assert.equal(JSON.parse(calls.at(-1).body).id_factura_proveedor,2);
  const {api:r}=await import('../src/modules/remuneraciones-chofer/services/remuneraciones-chofer.api.js');
  await r.crear({id_chofer:1});assert.equal(calls.at(-1).path,'/api/remuneraciones-chofer/generar');
  for (const call of calls) {assert.equal(call.credentials,'include');assert.equal(call.headers['X-CSRF-Protection'],'1');}
 } finally {globalThis.fetch=original;}
});

test('Campos múltiples y anidados: arrays, cero y campos ocultos no se convierten en texto',()=>{
 const fields=[{name:'detalles',type:'rows',minRows:1,label:'Detalles',fields:[{name:'cantidad',required:true,label:'Cantidad'}]},{name:'planes',type:'select',multiple:true}];
 assert.deepEqual(prepararCampos(fields,{detalles:[{cantidad:0}],planes:['1','2']}),{detalles:[{cantidad:'0'}],planes:['1','2']});
 assert.throws(()=>prepararCampos(fields,{detalles:[],planes:[]}));
});
