# Liquidaciones preparadas
Aplicar 035_liquidaciones_preparadas.sql a la base existente antes de desplegar el código actualizado, sin procesos escribiendo durante el despliegue.

Convierte ENVIADA en PREPARADA sin alterar importes, versiones ni fechas. Actualiza restricciones y el trigger de transiciones. Es transaccional. Las instalaciones nuevas usan schema.sql.

Por compatibilidad se conservan el endpoint POST /api/liquidaciones/:id/enviar, el permiso liquidaciones.enviar y la columna fecha_envio (fecha de preparación). La respuesta y el filtro de estado usan PREPARADA. No envía documentos. Borrador permite editar/eliminar; preparada permite confirmar/anular; confirmada permite facturar/anular según las facturas vigentes. No hay retorno a borrador.
