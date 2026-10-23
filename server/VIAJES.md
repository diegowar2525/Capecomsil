# Viajes: modelo de datos aprobado

Están implementados el esquema, el registro transaccional, las consultas, la edición y la anulación de viajes.

Todas las operaciones requieren sesión y su permiso. Las escrituras requieren
`Content-Type: application/json` y `X-CSRF-Protection: 1`; en navegador usar
`credentials: "include"`. Ver [AUTORIZACION.md](AUTORIZACION.md).

## VIAJE

`id_viaje` (PK), `id_vehiculo` (FK), `id_chofer` (FK), `fecha_inicio` y `fecha_fin` (TIMESTAMP), `estado` (REGISTRADO/ANULADO), `fecha_anulacion`, `motivo_anulacion`.

## DETALLE_VIAJE

`id_detalle_viaje` (PK), `id_viaje` (FK), `id_gasolinera`, `id_terminal`, `id_modalidad_tarifa`, exactamente una FK entre `id_tarifa` e `id_tarifa_capacidad`, `id_producto_transportado` (FK), `galones`, `tarifa_aplicada`, `valor_transporte`.

Relaciones: un viaje tiene varios detalles; una tarifa puede utilizarse en varios detalles; una liquidación agrupa entregas mediante `detalle_liquidacion`; cada producto transportado puede aparecer en varias entregas. Gasolinera y terminal se conservan en cada detalle. COSTO_VIAJE continúa asociado al viaje completo.

La modalidad vigente en la fecha de inicio selecciona tarifa por gasolinera/terminal o por gasolinera/capacidad del vehículo. Ambas cobran sobre galones entregados. Ver [TARIFAS_CAPACIDAD.md](TARIFAS_CAPACIDAD.md), incluida la migración 024 necesaria para instalaciones existentes.

Las tarifas utilizadas conservan su protección histórica, incluso si el viaje está anulado. La vigencia se valida al asignar o cambiar una tarifa, mover una entrega a otro viaje y cambiar la fecha del viaje. Las claves foráneas impiden eliminar tarifas utilizadas.

No se incorporan compartimientos ni planificación. Se rechaza la suma de galones superior a la capacidad del vehículo; cargas inferiores o iguales se permiten sin advertencias. Se registran viajes ya realizados y una nueva carga se considera otro viaje.

La relación con liquidaciones se almacena en `detalle_liquidacion`, que conserva copias históricas de galones, tarifa e importe. `id_liquidacion` ya no es una columna física de `detalle_viaje`: las consultas de entregas lo calculan para la liquidación vigente (estado distinto de ANULADA), o devuelven null si no existe.

## Registro desde Postman

`POST http://localhost:3000/api/viajes`

```json
{
  "fecha_inicio": "2026-10-08T08:00:00",
  "fecha_fin": "2026-10-08T12:00:00",
  "id_vehiculo": 1,
  "id_chofer": 1,
  "tramos": [
    { "orden": 1, "id_trayecto": 1 },
    { "orden": 2, "id_trayecto": 2 },
    { "orden": 3, "id_trayecto": 3 }
  ],
  "detalles": [
    { "id_gasolinera": 1, "id_terminal": 1, "id_producto_transportado": 1, "galones": "4000.00" },
    { "id_gasolinera": 2, "id_terminal": 1, "id_producto_transportado": 2, "galones": "6000.00" }
  ]
}
```

Inicio y fin requieren fecha y hora local sin zona, dentro del mismo día y con fin posterior al inicio. El día de inicio determina la vigencia de las tarifas y la remuneración diaria del chofer. Los galones deben ser positivos y admitir como máximo dos decimales. Debe existir una tarifa que cubra la fecha según la modalidad de la gasolinera. Por terminal se conserva el comportamiento histórico sin filtrar su estado administrativo; por capacidad se exige una tarifa activa para la capacidad exacta del vehículo, sin alternativa automática. Se rechaza repetir la misma combinación de gasolinera, terminal y combustible; un combustible sí puede entregarse a varios destinos.

La respuesta 201 incluye viaje, detalles, tramos, `kilometros_recorridos`, `total_galones` y `valor_transporte`. Las cantidades e importes son cadenas decimales. El precio se copia de la tarifa y el importe se redondea a dos decimales por entrega en PostgreSQL NUMERIC. Los totales suman los detalles. El registro no asocia entregas a liquidaciones. Los detalles de la respuesta POST se consultan dentro de la misma transacción y tienen la misma representación que en el GET individual: incluyen nombres de gasolinera, terminal y combustible, y el campo calculado `id_liquidacion`, que es null al crear el viaje. Estado, tarifas e importes enviados por el cliente se ignoran.

Vehículo, chofer y combustibles deben existir; sus estados administrativos no impiden registrar operaciones históricas. Referencias inválidas, exceso de capacidad o datos inválidos devuelven 400; ausencia de tarifa aplicable devuelve 409. No hay cambios en el inventario interno. Toda la operación comparte una transacción y bloquea las referencias relevantes hasta terminar. Requiere el schema.sql actualizado con TRAYECTO. La migración histórica 010 por sí sola no incorpora este catálogo.

## Consultas y anulación

- `GET /api/viajes`: listado con placa, nombre del chofer y totales de todas las entregas del viaje.
- `GET /api/viajes/:id`: cabecera, totales y detalles con nombres de gasolinera, terminal y combustible; incluye tarifa e importe históricos e id_liquidacion opcional.
- `POST /api/viajes/:id/anular`: recibe `{"motivo":"Viaje registrado por error"}`.

Filtros opcionales: `fecha_desde`, `fecha_hasta` (YYYY-MM-DD, inclusivos sobre fecha), `id_vehiculo`, `id_chofer`, `id_gasolinera`, `id_terminal`, `estado` (REGISTRADO/ANULADO). `limit` predeterminado 50, máximo 200; `offset` predeterminado 0. Orden por fecha e ID descendentes. Sin coincidencias se devuelve `[]`; los filtros inválidos devuelven 400.

Crear y anular un viaje recalcula la remuneración diaria y su distribución en la misma transacción.
Se necesita configuración vigente de remuneración y registrar los feriados antes de generar el día.
La creación y la consulta individual incluyen `costos` de chofer, combustible, peajes y viático. Antes de registrar viajes deben existir las configuraciones vigentes: ver [COSTOS_HORARIOS.md](COSTOS_HORARIOS.md) y [REMUNERACIONES.md](REMUNERACIONES.md).

Ejemplo: `GET /api/viajes?id_gasolinera=2&fecha_desde=2026-10-01&fecha_hasta=2026-10-31&limit=50&offset=0`.

Los filtros por gasolinera y terminal seleccionan viajes que contienen una entrega coincidente con ambos. No recortan los totales del viaje; la consulta individual siempre devuelve todas sus entregas. Los nombres descriptivos son los actuales de los catálogos, mientras que tarifas e importes son los valores históricos guardados.

La anulación exige motivo (máximo 150 caracteres), conserva tramos, entregas e importes y registra estado ANULADO, fecha automática y motivo. No elimina ni revierte inventario. Devuelve 200 con el viaje completo; 404 si no existe; 409 si ya está anulado o cualquier entrega pertenece a una liquidación vigente (BORRADOR, ENVIADA o CONFIRMADA). Las asociaciones a liquidaciones ANULADAS se conservan como historial y no bloquean por sí solas la anulación del viaje. La asociación debe resolverse desde el futuro módulo de liquidaciones. Para corregir un viaje válido se utiliza la edición siguiente.

## Edición completa y auditoría (etapa 5)

`PUT /api/viajes/:id` exige `viajes.editar`, asignado inicialmente a JEFE y OPERADOR.
Recibe todos los campos de creación, además de `version` (obtenida del GET) y
`motivo` obligatorio, de máximo 150 caracteres. Los campos adicionales se rechazan:
no enviar el GET completo, estado, importes, tarifas ni identidad del autor.

```json
{
  "version": 1,
  "motivo": "Corrección de galones y horario",
  "fecha_inicio": "2026-10-08T08:00:00",
  "fecha_fin": "2026-10-08T12:00:00",
  "id_vehiculo": 1,
  "id_chofer": 1,
  "detalles": [
    { "id_detalle_viaje": 10, "id_gasolinera": 1, "id_terminal": 1, "id_producto_transportado": 1, "galones": "4000.00" }
  ],
  "tramos": [
    { "id_tramo_viaje": 20, "orden": 1, "id_trayecto": 1, "observacion": null }
  ]
}
```

Los IDs son ilustrativos. El trayecto debe visitar el terminal y la gasolinera de
la entrega, como en la creación.

- Entregas y tramos existentes: enviar sus IDs para actualizarlos conservando la
  identidad. Deben pertenecer al viaje y no pueden repetirse.
- Filas nuevas: omitir el ID, sin enviarlo como null. Las filas existentes ausentes
  del arreglo se eliminan, salvo entregas con historial de liquidación.
- Un viaje ANULADO o con alguna entrega en liquidación BORRADOR, ENVIADA o CONFIRMADA
  no se puede editar. Una liquidación ANULADA permite corregir la entrega conservando
  su ID, pero impide eliminarla. Su detalle de liquidación conserva sus copias históricas.
- Los kilómetros de un tramo conservado se mantienen si no cambia el trayecto.
  Un tramo nuevo o cuyo trayecto cambia toma los kilómetros actuales del catálogo.
  Un trayecto inactivo solo puede conservarse en el tramo que ya lo utilizaba.
- Tarifas y configuraciones corresponden a la fecha final del viaje. La tarifa y
  el importe se calculan en el servidor; cambiar de fecha puede cambiar sus valores.
- Cambiar vehículo se bloquea si existen gastos vinculados, incluso anulados.
  La edición no cambia los gastos ni los abastecimientos ni sus fechas.

Se validan capacidad, referencias, continuidad del recorrido, horario, cruces con
viajes y mantenimientos, vigencias y liquidaciones dentro de la misma transacción.
Fecha y tarifas pueden cambiar juntas: su coherencia se verifica al final, antes
de confirmar. La comprobación de tarifas sigue siendo inmediata para otros usos
SQL, salvo que se difieran expresamente esos constraints.

Se regeneran los costos automáticos del viaje (sus IDs pueden cambiar) y se
recalculan remuneraciones y viáticos de los choferes/días anterior y nuevo.
Los demás viajes de esos días reciben la distribución corregida en centavos.
Las remuneraciones y viáticos diarios existentes conservan sus configuraciones
históricas; los nuevos requieren configuración vigente.

La respuesta 200 tiene la misma representación que el GET individual y una versión
incrementada. Una versión desactualizada devuelve 409: consultar nuevamente y revisar
los cambios antes de reenviar. No reintentar automáticamente con la nueva versión.

`GET /api/viajes/:id/historial` exige `viajes.consultar` y devuelve las ediciones más
recientes primero, con actor de la sesión, motivo, fecha, versiones y copias antes/después
del viaje, entregas, tramos y costos. No hay rutas para modificar o borrar el historial.
Cubre ediciones realizadas por esta API, no reconstruye autoría de registros antiguos.
Si falla el historial o una validación, se revierte toda la edición y sus recálculos.

Base nueva: `database/schema.sql` (45 tablas). Base actualizada hasta la 017:
aplicar `database/migrations/018_edicion_viajes.sql`. La migración asigna versión 1
a viajes existentes sin inventar eventos anteriores. No se ejecuta automáticamente.
El cierre de días todavía corresponde al punto 6; esta edición aún no bloquea por
el vencimiento de las 18:00.

Se bloquean la cabecera y las entregas durante la transacción. El futuro módulo de liquidaciones deberá bloquear la cabecera y rechazar viajes anulados antes de asociar detalles. La base debe incluir el modelo actual de `detalle_liquidacion`; ver la transición de esquema descrita a continuación.

## Migración del esquema

El esquema consolidado es `database/schema.sql`. La migración `008_viajes_entregas.sql` copia la tarifa y liquidación de cada cabecera antigua a todos sus detalles antes de eliminar las columnas de VIAJE. Conserva galones, tarifas aplicadas e importes, y transforma PENDIENTE en REGISTRADO. Las fechas y motivos de anulaciones anteriores quedan nulos si no existían.

La migración es transaccional y se aplica una sola vez a la versión anterior. Si hay viajes sin detalles o estados desconocidos, aborta para no perder relaciones ni inventar entregas. Deben revisarse esos registros antes de reintentar. No ejecutarla sobre un esquema nuevo que ya incluya estos cambios.

La migración `013_liquidaciones_detalles.sql` realiza una transición posterior: crea `detalle_liquidacion`, copia las asociaciones y valores históricos y elimina la columna `detalle_viaje.id_liquidacion`. También incorpora estados y fechas de liquidación. Exige liquidaciones previas en BORRADOR sin confirmar; revisar sus precondiciones antes de aplicarla. La migración 008 por sí sola no deja la base en la versión actual. Una base nueva debe usar el esquema consolidado sin ejecutar además estas migraciones.

## Tramos

El modelo tramo_viaje se utiliza dentro del servicio de viajes, sin CRUD independiente. Cada tramo recibe orden, id_trayecto y observacion opcional. El trayecto debe existir y estar activo. El servidor resuelve las ubicaciones y copia sus kilómetros; ubicaciones o kilómetros adicionales enviados en el JSON se ignoran. Se ordenan por orden y se exige secuencia desde 1 sin huecos ni duplicados.

El primer tramo puede partir de una gasolinera o un terminal; su destino no tiene que ser un terminal. Un terminal de origen también cuenta como punto de carga anterior a la entrega. Cada origen siguiente coincide con el destino anterior. El recorrido debe pasar por el terminal de cada entrega antes de llegar a la gasolinera destinataria. No se exige regresar al origen. Las ubicaciones deben existir.

Los kilómetros se configuran en TRAYECTO, no se calculan mediante mapas; el backend suma los tramos con NUMERIC. POST, GET individual y anulación devuelven tramos; GET individual y anulación añaden nombres de origen/destino. El listado incluye kilometros_recorridos. Estos kilómetros se usan para generar automáticamente el costo estimado de COMBUSTIBLE, junto con el consumo y precio vigentes. Los peajes de los tramos generan el costo PEAJE; las asignaciones de CHOFER y VIATICO se calculan por día. Ver [COSTOS_HORARIOS.md](COSTOS_HORARIOS.md).

El catálogo tiene CRUD en /api/trayectos; ver TRAYECTOS.md. Los IDs del ejemplo presuponen trayectos configurados: gasolinera 1 → terminal 1, terminal 1 → gasolinera 1 y gasolinera 1 → gasolinera 2. Cambiar los kilómetros del catálogo solo afecta a nuevos tramos. Sus ubicaciones no pueden cambiarse si tiene historial y las FK impiden eliminarlo. Inactivarlo no oculta ni invalida viajes anteriores.
