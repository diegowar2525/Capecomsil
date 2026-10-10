# Viajes: modelo de datos aprobado

Están implementados el esquema y el registro transaccional mediante `POST /api/viajes`. Las consultas y la anulación por API quedan para las próximas etapas.

## VIAJE

`id_viaje` (PK), `id_vehiculo` (FK), `id_chofer` (FK), `fecha`, `estado` (REGISTRADO/ANULADO), `fecha_anulacion`, `motivo_anulacion`.

## DETALLE_VIAJE

`id_detalle_viaje` (PK), `id_viaje` (FK), `id_tarifa` (FK obligatoria), `id_liquidacion` (FK opcional), `id_producto_transportado` (FK), `galones`, `tarifa_aplicada`, `valor_transporte`.

Relaciones: un viaje tiene varios detalles; una tarifa puede utilizarse en varios detalles; una liquidación agrupa detalles; cada producto transportado puede aparecer en varias entregas. Gasolinera y terminal se obtienen desde la tarifa de cada detalle. COSTO_VIAJE continúa asociado al viaje completo.

Las tarifas utilizadas conservan su protección histórica, incluso si el viaje está anulado. La vigencia se valida al asignar o cambiar una tarifa, mover una entrega a otro viaje y cambiar la fecha del viaje. Las claves foráneas impiden eliminar tarifas utilizadas.

No se incorporan compartimientos ni planificación. Se rechaza la suma de galones superior a la capacidad del vehículo; cargas inferiores o iguales se permiten sin advertencias. Se registran viajes ya realizados y una nueva carga se considera otro viaje.

## Registro desde Postman

`POST http://localhost:3000/api/viajes`

```json
{
  "fecha": "2026-10-08",
  "id_vehiculo": 1,
  "id_chofer": 1,
  "detalles": [
    { "id_gasolinera": 1, "id_terminal": 1, "id_producto_transportado": 1, "galones": "4000.00" },
    { "id_gasolinera": 2, "id_terminal": 1, "id_producto_transportado": 2, "galones": "6000.00" }
  ]
}
```

La fecha usa YYYY-MM-DD. Los galones deben ser positivos y admitir como máximo dos decimales. Debe existir una tarifa que cubra la fecha para cada gasolinera y terminal, sin importar su estado administrativo. Se rechaza repetir la misma combinación de gasolinera, terminal y combustible; un combustible sí puede entregarse a varios destinos.

La respuesta 201 incluye viaje, detalles, `total_galones` y `valor_transporte`. Las cantidades e importes son cadenas decimales. El precio se copia de la tarifa y el importe se redondea a dos decimales por entrega en PostgreSQL NUMERIC. Los totales suman los detalles. `id_liquidacion` queda en null. Estado, tarifas e importes enviados por el cliente se ignoran.

Vehículo, chofer y combustibles deben existir; sus estados administrativos no impiden registrar operaciones históricas. Referencias inválidas, exceso de capacidad o datos inválidos devuelven 400; ausencia de tarifa aplicable devuelve 409. No hay cambios en el inventario interno. Toda la operación comparte una transacción y bloquea las referencias relevantes hasta terminar. No requiere nuevas migraciones después de la 008.

## Migración

El esquema consolidado es `database/schema.sql`. La migración `008_viajes_entregas.sql` copia la tarifa y liquidación de cada cabecera antigua a todos sus detalles antes de eliminar las columnas de VIAJE. Conserva galones, tarifas aplicadas e importes, y transforma PENDIENTE en REGISTRADO. Las fechas y motivos de anulaciones anteriores quedan nulos si no existían.

La migración es transaccional y se aplica una sola vez a la versión anterior. Si hay viajes sin detalles o estados desconocidos, aborta para no perder relaciones ni inventar entregas. Deben revisarse esos registros antes de reintentar. No ejecutarla sobre un esquema nuevo que ya incluya estos cambios.
