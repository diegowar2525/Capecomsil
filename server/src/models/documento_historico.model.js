// Uso interno por el importador: nunca interpola nombres de tablas recibidos del usuario.
const createCliente = async (client, d) => (await client.query(`
    INSERT INTO factura(id_empresa,numero_factura,fecha_emision,fecha_vencimiento,subtotal,retencion,valor_neto,
        historico,importe_pagado_previo,fecha_corte,archivo_origen,hoja_origen,fila_origen,huella_origen,estado,motivo_anulacion)
    VALUES($1,$2,$3,$4,$5::numeric+$6::numeric,$6,$5,true,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`, valores(d))).rows[0];
const createProveedor = async (client, d) => (await client.query(`
    INSERT INTO factura_proveedor(id_proveedor,numero_factura,fecha_emision,fecha_vencimiento,subtotal,descuento_total,impuestos,total,
        historico,importe_pagado_previo,fecha_corte,archivo_origen,hoja_origen,fila_origen,huella_origen,estado,motivo_anulacion)
    VALUES($1,$2,$3,$4,NULL,NULL,NULL,$5,true,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [d.id_titular,d.numero_factura,d.fecha_emision,d.fecha_vencimiento,d.total,d.importe_pagado_previo,
        d.fecha_corte,d.archivo_origen,d.hoja_origen,d.fila_origen,d.huella_origen,d.estado,d.motivo_anulacion])).rows[0];
const valores = d => [d.id_titular,d.numero_factura,d.fecha_emision,d.fecha_vencimiento,d.total,d.retencion,
    d.importe_pagado_previo,d.fecha_corte,d.archivo_origen,d.hoja_origen,d.fila_origen,d.huella_origen,d.estado,d.motivo_anulacion];
module.exports = { createCliente, createProveedor };
