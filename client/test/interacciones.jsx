// Entorno de prueba aislado: intercepta toda petición API, nunca usa el backend real.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { routes } from '../src/app/routes.jsx';
import { AuthContext } from '../src/modules/auth/context/auth.context.js';
import { PerfilProvider } from '../src/modules/perfil/context/PerfilProvider.jsx';
import '../src/index.css';
const records = {
 gasolineras: [{id_gasolinera:1,nombre:'Gasolinera de prueba',estado:true}],
 terminales: [{id_terminal:1,nombre:'Terminal de prueba',estado:true}],
 choferes: [{id_chofer:1,nombre:'Chofer de prueba',estado:true}],
 vehiculos: [{id_vehiculo:1,placa:'TEST-001',estado:true}],
 proveedores: [{id_proveedor:1,nombre:'Proveedor de prueba',estado:true}],
 productos: [{id_producto:1,nombre:'Filtro de prueba',estado:true}],
 'productos-transportados': [{id_producto_transportado:1,nombre:'Diésel',estado:true}],
 trayectos: [{id_trayecto:1,id_terminal_origen:1,id_gasolinera_destino:1,descripcion:'Terminal a gasolinera',estado:true}],
 'facturas-proveedor': [{id_factura_proveedor:1,numero_factura:'PRUEBA-001',id_proveedor:1,estado:'REGISTRADA',detalles:[{id_detalle_factura_proveedor:1,descripcion:'Filtro',cantidad:'2'}]}],
 liquidaciones: [{id_liquidacion:1,id_gasolinera:1,estado:'BORRADOR',periodo_inicio:'2026-10-01',periodo_fin:'2026-10-31',version:3,detalles:[{id_detalle_viaje:1,galones:'100',tarifa_aplicada:'0.5',valor_transporte:'50'}]}],
 viajes: [{id_viaje:1,id_vehiculo:1,id_chofer:1,estado:'REGISTRADO',fecha_inicio:'2026-10-26T08:00:00',fecha_fin:'2026-10-26T09:00:00',version:2,detalles:[{id_detalle_viaje:1,id_gasolinera:1,id_terminal:1,id_producto_transportado:1,galones:'100'}],tramos:[{id_tramo_viaje:1,id_trayecto:1,orden:1,id_terminal_origen:1,id_gasolinera_destino:1}],costos:[{id_costo:1,tipo_costo:'COMBUSTIBLE',valor:'5'}]}]
};
let failNext = false;
const requests = [];
window.fetch = async (input, options = {}) => {
 const url = new URL(input, location.origin);
 if (!url.pathname.startsWith('/api/')) throw new Error('La prueba solo admite peticiones API simuladas.');
 const [, , resource, id, action] = url.pathname.split('/');
 const method = options.method ?? 'GET';
 const body = options.body ? JSON.parse(options.body) : undefined;
 requests.push({ path:url.pathname,method,body });
 document.querySelector('#requests').textContent = JSON.stringify(requests.slice(-5),null,2);
 if (failNext && method !== 'GET') { failNext = false; return Response.json({message:'Error simulado: no se pudo guardar.'},{status:409}); }
 let data = [];
 if (resource === 'liquidaciones' && id === 'entregas-disponibles') data = records.liquidaciones[0].detalles;
 else if (resource === 'facturas-proveedor' && action === 'pendientes-recepcion') data = [{id_detalle_factura_proveedor:1,descripcion:'Filtro',pendiente_recibir:'2'}];
 else if (resource === 'facturas-proveedor' && action === 'recepciones') data = [];
 else if (resource === 'inventario' && id === 'stock') data = [{id_producto:1,nombre:'Filtro',stock_actual:'2',stock_minimo:'1'}];
 else if (resource === 'informes' && id === 'resumen-economico') data = {cantidad_viajes:1,ingreso_transporte:'50',costo_estimado_viajes:'5',margen_estimado_viajes:'45'};
 else if (resource === 'informes' && id === 'viajes') data = records.viajes;
 else if (resource === 'informes' && id === 'viaticos') data = [{id_viatico_chofer:1,nombre:'Chofer de prueba',fecha:'2026-10-26',estimado:'10'}];
 else if (method === 'GET') data = id ? records[resource]?.find(row => String(Object.values(row)[0]) === id) ?? {} : records[resource] ?? [];
 else if (method === 'DELETE') { records[resource] = records[resource].filter(row => String(Object.values(row)[0]) !== id); data = {eliminado:true}; }
 else if (action === 'enviar') { records.liquidaciones[0].estado='ENVIADA'; records.liquidaciones[0].version++; data=records.liquidaciones[0]; }
 else { data = {...body}; if (resource==='liquidaciones' && id) Object.assign(records.liquidaciones[0],body); }
 return Response.json(data);
};
const permissions = ['catalogos','tarifas','configuraciones','viajes','inventario','informes','recepciones','liquidaciones','mantenimientos','compras','pagos_proveedor','gastos','planes_mantenimiento','abastecimientos','remuneraciones'].flatMap(resource => ['consultar','crear','editar','eliminar','anular','enviar','confirmar','generar','ajustar','revertir','finalizar','registrar_cumplimientos'].map(action => `${resource}.${action}`));
export function TestApp() {
 const [path,setPath]=useState('/liquidaciones');
 const [mobile,setMobile]=useState(false);
 const Component=routes.find(route=>route.path===path).Component;
 if (new URLSearchParams(location.search).has('mobile')) return <AuthContext.Provider value={{usuario:{id_usuario:1,nombre:'Prueba',rol:'JEFE'},permisos:permissions,loading:false}}><PerfilProvider><main style={{padding:12}}><Component key={path}/></main><pre id="requests" style={{whiteSpace:'pre-wrap'}}/></PerfilProvider></AuthContext.Provider>;
 return <AuthContext.Provider value={{usuario:{id_usuario:1,nombre:'Prueba',rol:'JEFE'},permisos:permissions,loading:false}}><PerfilProvider>
 <aside style={{padding:16}}><strong>Entorno de prueba: datos simulados</strong><label>Pantalla <select value={path} onChange={event=>setPath(event.target.value)}>{routes.map(route=><option key={route.path} value={route.path}>{route.label}</option>)}</select></label><button onClick={()=>{failNext=true;}}>Simular próximo error</button><button onClick={()=>setMobile(!mobile)}>Vista móvil</button></aside>
 {mobile ? <iframe title="Vista de 390 píxeles" src="/test/interacciones.html?mobile=1" style={{width:390,height:740,border:'1px solid'}}/> : <main style={{padding:24}}><Component key={path}/></main>}
 <details><summary>Peticiones simuladas</summary><pre id="requests"/></details>
 </PerfilProvider></AuthContext.Provider>;
}
const root = createRoot(document.getElementById('root'));
root.render(<TestApp/>);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());


