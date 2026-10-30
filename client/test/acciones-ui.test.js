import test from 'node:test';
import assert from 'node:assert/strict';
import { organizarAcciones, accionesDeFila } from '../src/domain/acciones.js';
import { actions as viajes } from '../src/modules/viajes/viajes.actions.js';
import { actions as liquidaciones } from '../src/modules/liquidaciones/liquidaciones.actions.js';
import { actions as compras } from '../src/modules/facturas-proveedores/facturas-proveedores.actions.js';
import { actions as mantenimiento } from '../src/modules/mantenimiento/mantenimiento.actions.js';
import { actions as gasolineras } from '../src/modules/gasolineras/gasolineras.actions.js';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const permisos = ['consultar','editar','eliminar','anular'].map(action => `viajes.${action}`);
test('Viajes presenta tres íconos; historial queda en detalle y anular tiene ícono propio', () => {
 const actions = organizarAcciones(viajes, 'viajes');
 const row = accionesDeFila(actions, { estado: 'REGISTRADO' }, permisos);
 assert.deepEqual(row.map(action => [action.id,action.icon]), [['detail','eye'],['edit','pencil'],['annul','ban']]);
 assert.equal(actions.find(action => action.id === 'history').parent,'detail');
 assert.deepEqual(accionesDeFila(actions,{estado:'ANULADO'},permisos).map(action=>action.id),['detail']);
 assert.deepEqual(accionesDeFila(actions,{estado:'REGISTRADO'},['viajes.consultar']).map(action=>action.id),['detail']);
 assert.equal(viajes.find(action=>action.id==='history').parent,undefined,'No mutar las declaraciones originales');
});

test('Liquidaciones conserva eliminar borrador y anular enviada como operaciones distintas', () => {
 const actions=organizarAcciones(liquidaciones,'liquidaciones');
 const permisos=['consultar','editar','eliminar','anular'].map(action=>`liquidaciones.${action}`);
 assert.deepEqual(accionesDeFila(actions,{estado:'BORRADOR'},permisos).map(action=>[action.id,action.icon]),[['detail','eye'],['edit','pencil'],['delete','trash']]);
 assert.deepEqual(accionesDeFila(actions,{estado:'ENVIADA'},permisos).map(action=>[action.id,action.icon]),[['detail','eye'],['annul','ban']]);
 for(const id of ['send','confirm']) assert.equal(actions.find(action=>action.id===id).parent,'detail');
 assert.equal(actions.find(action=>action.id==='available').global,true);
});

test('Consultas y operaciones secundarias siguen accesibles dentro del detalle', () => {
 for (const source of [compras,mantenimiento]) {
  const actions=organizarAcciones(source);
  for(const action of actions.filter(action=>!['detail','edit','delete','annul'].includes(action.id))) assert.equal(action.parent,'detail');
 }
 const actions=organizarAcciones(gasolineras);
 assert.equal(actions.find(action=>action.id==='change-modality').parent,'edit');
 assert.equal(actions.find(action=>action.id==='change-modality').permission,'tarifas.editar');
});

test('El modal de detalle ofrece historial y respeta el permiso de la acción secundaria', async () => {
 const server=await createServer({server:{middlewareMode:true,watch:null,hmr:false},appType:'custom'});
 try {
  const {AccionCatalogo}=await server.ssrLoadModule('/src/components/CatalogoConectado/AccionCatalogo.jsx');
  const {AuthContext}=await server.ssrLoadModule('/src/modules/auth/context/auth.context.js');
  const actions=organizarAcciones(viajes,'viajes');
  const render=permisos=>renderToStaticMarkup(createElement(AuthContext.Provider,{value:{permisos}},createElement(AccionCatalogo,{definition:{columns:[],fields:[],actions},id:1,action:actions[0],registro:{id_viaje:1,estado:'REGISTRADO'},catalogos:{},onClose:()=>{}})));
  assert.match(render(['viajes.consultar']),/>Historial<\/span>/);
  assert.doesNotMatch(render([]),/>Historial<\/span>/);
 } finally {await server.close();}
});
