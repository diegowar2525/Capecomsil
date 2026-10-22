const fs = require('node:fs');
const root = 'client/src/modules/';
const definitions = {
 choferes: [['id_chofer','ID'],['cedula','Cédula'],['nombre','Nombre'],['telefono','Teléfono'],['tipo_remuneracion','Tipo de remuneración'],['estado','Estado']],
 vehiculos: [['id_vehiculo','ID'],['placa','Placa'],['marca','Marca'],['modelo','Modelo'],['anio','Año'],['capacidad_galones','Capacidad (galones)'],['kilometraje_base','Kilometraje base'],['fecha_inicio_control_km','Inicio del control de km'],['estado','Estado']],
 gasolineras: [['id_gasolinera','ID'],['nombre','Gasolinera'],['ruc','RUC'],['direccion','Dirección'],['telefono','Teléfono'],['correo','Correo'],['representante_legal','Representante legal'],['agente_retencion','Agente de retención'],['estado','Estado']],
 terminales: [['id_terminal','ID'],['nombre','Terminal'],['ubicacion','Ubicación'],['estado','Estado']],
 proveedores: [['id_proveedor','ID'],['nombre','Proveedor'],['ruc','RUC'],['direccion','Dirección'],['telefono','Teléfono'],['correo','Correo'],['estado','Estado']],
 productos: [['id_producto_transportado','ID'],['nombre','Producto transportado'],['descripcion','Descripción'],['unidad_medida','Unidad de medida'],['estado','Estado']],
 viajes: [['id_viaje','N° Viaje'],['fecha_inicio','Inicio'],['fecha_fin','Fin'],['nombre_chofer','Chofer'],['placa','Vehículo'],['total_galones','Galones'],['valor_transporte','Valor del transporte'],['kilometros_recorridos','Kilómetros recorridos'],['estado','Estado']],
 'costos-viaje': [['id_costo_viaje','ID'],['id_viaje','N° Viaje'],['tipo_costo','Tipo de costo'],['valor','Valor'],['descripcion','Descripción']],
 facturacion: [['id_factura','ID'],['numero_factura','N° Factura'],['id_liquidacion','N° Liquidación'],['fecha_emision','Emisión'],['fecha_vencimiento','Vencimiento'],['subtotal','Subtotal'],['retencion','Retención'],['valor_neto','Valor neto'],['estado','Estado']],
 pagos: [['id_pago','ID'],['id_factura','N° Factura (ID)'],['fecha_pago','Fecha de pago'],['forma_pago','Forma de pago'],['banco','Banco'],['numero_comprobante','Comprobante'],['monto','Monto'],['observacion','Observación']],
 'facturas-proveedores': [['id_factura_proveedor','ID'],['numero_factura','N° Factura'],['id_proveedor','Proveedor (ID)'],['fecha_emision','Emisión'],['fecha_vencimiento','Vencimiento'],['subtotal','Subtotal'],['descuento_total','Descuento'],['impuestos','Impuestos'],['total','Total'],['total_pagado','Pagado'],['saldo_pendiente','Saldo'],['estado_pago','Estado de pago'],['estado','Estado']],
 'pagos-proveedores': [['id_pago_proveedor','ID'],['numero_factura','N° Factura'],['id_proveedor','Proveedor (ID)'],['fecha_pago','Fecha de pago'],['forma_pago','Forma de pago'],['numero_cheque','N° Cheque'],['numero_comprobante','Comprobante'],['monto','Monto'],['estado','Estado']],
 gastos: [['id_gasto','ID'],['id_viaje','Viaje (ID)'],['id_vehiculo','Vehículo (ID)'],['id_proveedor','Proveedor (ID)'],['tipo_gasto','Tipo de gasto'],['descripcion','Descripción'],['fecha','Fecha'],['monto','Monto'],['numero_comprobante','Comprobante'],['estado','Estado']],
 mantenimiento: [['id_mantenimiento','ID'],['placa','Vehículo'],['tipo','Tipo'],['nombre_proveedor','Proveedor'],['fecha_inicio','Inicio'],['fecha_fin','Fin'],['monto','Monto'],['descripcion','Descripción'],['estado','Estado']]
};
const write = (file, value, name) => fs.writeFileSync(file, `export const ${name} = ${JSON.stringify(value,null,4)};\n`);
for (const [module, cols] of Object.entries(definitions)) {
 const columns = cols.map(([key,label]) => ({ key,label }));
 write(`${root}${module}/${module}.columns.js`, columns, 'columns');
}
write(`${root}dashboard/dashboard.columns.js`, definitions.viajes.map(([key,label])=>({key,label})), 'columns');
const editable = {
 choferes: ['nombre','cedula','telefono','tipo_remuneracion','imagen_url','estado'],
 vehiculos: ['placa','marca','modelo','anio','capacidad_galones','kilometraje_base','fecha_inicio_control_km','imagen_url','estado'],
 gasolineras: ['nombre','ruc','direccion','telefono','correo','representante_legal','agente_retencion','estado'],
 proveedores: ['nombre','ruc','direccion','telefono','correo','estado'], terminales: ['nombre','ubicacion','estado'],
 productos: ['nombre','descripcion','unidad_medida','estado']
};
const required = {choferes:['nombre','cedula','tipo_remuneracion'],vehiculos:['placa','marca','modelo','anio','capacidad_galones'],gasolineras:['nombre','ruc'],proveedores:['nombre'],terminales:['nombre'],productos:['nombre','unidad_medida']};
for (const [module,names] of Object.entries(editable)) {
 const fields = names.map(name => {
  const field = {name,label:definitions[module].find(([key])=>key===name)?.[1] ?? 'URL de imagen',required:required[module].includes(name)};
  if (['estado','agente_retencion'].includes(name)) Object.assign(field,{type:'checkbox',defaultChecked:name==='estado',label:name==='estado'?'Activo':field.label});
  if (name==='tipo_remuneracion') Object.assign(field,{type:'select',options:[{value:'DIARIO_FIJO',label:'Diario fijo'},{value:'DIA_TRABAJADO',label:'Día trabajado'}]});
  if (['anio','capacidad_galones','kilometraje_base'].includes(name)) Object.assign(field,{type:'number',min:name==='anio'?1:name==='capacidad_galones'?0.01:0,step:name==='anio'?1:0.01});
  if (name==='fecha_inicio_control_km') field.type='datetime-local';
  if (name==='correo') field.type='email';
  if (name==='telefono') field.type='tel';
  if (name==='imagen_url') field.type='url';
  if (name==='descripcion') field.type='textarea';
  return field;
 });
 write(`${root}${module}/${module}.fields.js`,fields,'fields');
}
// Identidad de fila basada en la entidad real, no en un ID genérico.
for (const [module,cols] of Object.entries(definitions)) {
 const filename=fs.readdirSync(root+module).find(f=>f.endsWith('Page.jsx'));
 let s=fs.readFileSync(`${root}${module}/${filename}`,'utf8');
 s=s.replace('<DataTable columns=',`<DataTable rowKey="${cols[0][0]}" columns=`).replace('<CatalogoPage {...page}',`<CatalogoPage rowKey="${cols[0][0]}" {...page}`);
 s=s.replace('Buscar por guía, placa o chofer...','Buscar por número de viaje, placa o chofer...');
 fs.writeFileSync(`${root}${module}/${filename}`,s);
}
