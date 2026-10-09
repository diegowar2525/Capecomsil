# Viajes: modelo de datos aprobado

Solo está implementada la adaptación del esquema. El registro, las consultas y la anulación por API quedan para las próximas etapas.

## VIAJE

`id_viaje` (PK), `id_vehiculo` (FK), `id_chofer` (FK), `fecha`, `estado` (REGISTRADO/ANULADO), `fecha_anulacion`, `motivo_anulacion`.

## DETALLE_VIAJE

`id_detalle_viaje` (PK), `id_viaje` (FK), `id_tarifa` (FK obligatoria), `id_liquidacion` (FK opcional), `id_producto_transportado` (FK), `galones`, `tarifa_aplicada`, `valor_transporte`.

Relaciones: un viaje tiene varios detalles; una tarifa puede utilizarse en varios detalles; una liquidación agrupa detalles; cada producto transportado puede aparecer en varias entregas. Gasolinera y terminal se obtienen desde la tarifa de cada detalle. COSTO_VIAJE continúa asociado al viaje completo.

Las tarifas utilizadas conservan su protección histórica, incluso si el viaje está anulado. La vigencia se valida al asignar o cambiar una tarifa, mover una entrega a otro viaje y cambiar la fecha del viaje. Las claves foráneas impiden eliminar tarifas utilizadas.

No se incorporan compartimientos, planificación ni reglas de advertencia/rechazo basadas en capacidad. Se mantiene la capacidad del vehículo como atributo existente. Se registrarán viajes ya realizados y una nueva carga se considerará otro viaje.

## Migración

El esquema consolidado es `database/schema.sql`. La migración `008_viajes_entregas.sql` copia la tarifa y liquidación de cada cabecera antigua a todos sus detalles antes de eliminar las columnas de VIAJE. Conserva galones, tarifas aplicadas e importes, y transforma PENDIENTE en REGISTRADO. Las fechas y motivos de anulaciones anteriores quedan nulos si no existían.

La migración es transaccional y se aplica una sola vez a la versión anterior. Si hay viajes sin detalles o estados desconocidos, aborta para no perder relaciones ni inventar entregas. Deben revisarse esos registros antes de reintentar. No ejecutarla sobre un esquema nuevo que ya incluya estos cambios.
