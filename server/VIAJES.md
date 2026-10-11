# Viajes: modelo de datos aprobado

Están implementados el esquema, el registro transaccional, las consultas y la anulación de viajes.

## VIAJE

`id_viaje` (PK), `id_vehiculo` (FK), `id_chofer` (FK), `fecha_inicio`, `fecha_fin`, `estado` (REGISTRADO/ANULADO), `fecha_anulacion`, `motivo_anulacion`.

## DETALLE_VIAJE

`id_detalle_viaje` (PK), `id_viaje` (FK), `id_tarifa` (FK obligatoria), `id_liquidacion` (FK opcional), `id_producto_transportado` (FK), `galones`, `tarifa_aplicada`, `valor_transporte`.

Relaciones: un viaje tiene varios detalles; una tarifa puede utilizarse en varios detalles; una liquidación agrupa detalles; cada producto transportado puede aparecer en varias entregas. Gasolinera y terminal se obtienen desde la tarifa de cada detalle. COSTO_VIAJE continúa asociado al viaje completo.

Las tarifas utilizadas conservan su protección histórica, incluso si el viaje está anulado. La vigencia se valida al asignar o cambiar una tarifa, mover una entrega a otro viaje y cambiar la fecha del viaje. Las claves foráneas impiden eliminar tarifas utilizadas.

No se incorporan compartimientos ni planificación. Se rechaza la suma de galones superior a la capacidad del vehículo; cargas inferiores o iguales se permiten sin advertencias. Se registran viajes ya realizados y una nueva carga se considera otro viaje.

## Registro desde Postman

`POST http://localhost:3000/api/viajes`

```json
{
  "fecha_inicio": "2026-10-08T07:00:00",
  "fecha_fin": "2026-10-09T10:30:00",
  "id_vehiculo": 1,
  "id_chofer": 1,
  "tramos": [
    { "orden": 1, "id_gasolinera_origen": 1, "id_terminal_destino": 1, "kilometros": "20.00" },
    { "orden": 2, "id_terminal_origen": 1, "id_gasolinera_destino": 1, "kilometros": "20.00" },
    { "orden": 3, "id_gasolinera_origen": 1, "id_gasolinera_destino": 2, "kilometros": "30.00" }
  ],
  "detalles": [
    { "id_gasolinera": 1, "id_terminal": 1, "id_producto_transportado": 1, "galones": "4000.00" },
    { "id_gasolinera": 2, "id_terminal": 1, "id_producto_transportado": 2, "galones": "6000.00" }
  ]
}
```

Inicio y fin aceptan YYYY-MM-DD (medianoche) o YYYY-MM-DDTHH:mm:ss, con hora local sin sufijo Z ni desplazamiento horario. Fin no puede preceder a inicio. La fecha de inicio determina la vigencia de las tarifas. Los galones deben ser positivos y admitir como máximo dos decimales. Debe existir una tarifa que cubra la fecha para cada gasolinera y terminal, sin importar su estado administrativo. Se rechaza repetir la misma combinación de gasolinera, terminal y combustible; un combustible sí puede entregarse a varios destinos.

La respuesta 201 incluye viaje, detalles, tramos, `kilometros_recorridos`, `total_galones` y `valor_transporte`. Las cantidades e importes son cadenas decimales. El precio se copia de la tarifa y el importe se redondea a dos decimales por entrega en PostgreSQL NUMERIC. Los totales suman los detalles. `id_liquidacion` queda en null. Estado, tarifas e importes enviados por el cliente se ignoran.

Vehículo, chofer y combustibles deben existir; sus estados administrativos no impiden registrar operaciones históricas. Referencias inválidas, exceso de capacidad o datos inválidos devuelven 400; ausencia de tarifa aplicable devuelve 409. No hay cambios en el inventario interno. Toda la operación comparte una transacción y bloquea las referencias relevantes hasta terminar. Requiere el esquema con la migración 010 ya aplicada. No volver a ejecutarla para actualizar el backend.

## Consultas y anulación

- `GET /api/viajes`: listado con placa, nombre del chofer y totales de todas las entregas del viaje.
- `GET /api/viajes/:id`: cabecera, totales y detalles con nombres de gasolinera, terminal y combustible; incluye tarifa e importe históricos e id_liquidacion opcional.
- `POST /api/viajes/:id/anular`: recibe `{"motivo":"Viaje registrado por error"}`.

Filtros opcionales: `fecha_desde`, `fecha_hasta` (YYYY-MM-DD, días completos inclusivos sobre fecha_inicio), `id_vehiculo`, `id_chofer`, `id_gasolinera`, `id_terminal`, `estado` (REGISTRADO/ANULADO). `limit` predeterminado 50, máximo 200; `offset` predeterminado 0. Orden por fecha_inicio e ID descendentes. Sin coincidencias se devuelve `[]`; los filtros inválidos devuelven 400.

Ejemplo: `GET /api/viajes?id_gasolinera=2&fecha_desde=2026-10-01&fecha_hasta=2026-10-31&limit=50&offset=0`.

Los filtros por gasolinera y terminal seleccionan viajes que contienen una entrega coincidente con ambos. No recortan los totales del viaje; la consulta individual siempre devuelve todas sus entregas. Los nombres descriptivos son los actuales de los catálogos, mientras que tarifas e importes son los valores históricos guardados.

La anulación exige motivo (máximo 150 caracteres), conserva tramos, entregas e importes y registra estado ANULADO, fecha automática y motivo. No elimina ni revierte inventario. Devuelve 200 con el viaje completo; 404 si no existe; 409 si ya está anulado o cualquier entrega pertenece a una liquidación, incluso si esa liquidación tiene otro estado. La asociación debe resolverse desde el futuro módulo de liquidaciones. Para corregir un viaje se anula y registra uno nuevo.

Se bloquean la cabecera y las entregas durante la transacción. El futuro módulo de liquidaciones deberá bloquear la cabecera y rechazar viajes anulados antes de asociar detalles. Estas operaciones no requieren nuevas columnas ni migraciones.

## Migración del esquema

El esquema consolidado es `database/schema.sql`. La migración `008_viajes_entregas.sql` copia la tarifa y liquidación de cada cabecera antigua a todos sus detalles antes de eliminar las columnas de VIAJE. Conserva galones, tarifas aplicadas e importes, y transforma PENDIENTE en REGISTRADO. Las fechas y motivos de anulaciones anteriores quedan nulos si no existían.

La migración es transaccional y se aplica una sola vez a la versión anterior. Si hay viajes sin detalles o estados desconocidos, aborta para no perder relaciones ni inventar entregas. Deben revisarse esos registros antes de reintentar. No ejecutarla sobre un esquema nuevo que ya incluya estos cambios.

## Tramos

El modelo tramo_viaje se utiliza dentro del servicio de viajes, sin CRUD independiente. Cada tramo recibe orden, exactamente un terminal o gasolinera como origen, exactamente uno como destino, kilómetros positivos con hasta dos decimales y observacion opcional. Se ordenan por orden y se exige secuencia desde 1 sin huecos ni duplicados.

El primer tramo sale de una gasolinera hacia un terminal. Cada origen siguiente coincide con el destino anterior. El recorrido debe pasar por el terminal de cada entrega antes de llegar a la gasolinera destinataria. No se exige regresar al origen. Las ubicaciones deben existir.

Los kilómetros son distancias informadas, no calculadas mediante mapas; el backend suma los tramos con NUMERIC. POST, GET individual y anulación devuelven tramos; GET individual y anulación añaden nombres de origen/destino. El listado incluye kilometros_recorridos. Estos kilómetros todavía no generan COSTO_VIAJE automáticamente.
