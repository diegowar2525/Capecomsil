# Cambios de esquema — migración 010

- `viaje.fecha` se sustituye por `fecha_inicio` y `fecha_fin`, ambas obligatorias. La vigencia de tarifas usa `fecha_inicio`.
- `trayecto`: PK `id_trayecto`; `nombre`; cuatro FK opcionales de origen/destino hacia terminal o gasolinera; `kilometros`; `estado`; `observacion`.
- `tramo_viaje`: PK `id_tramo_viaje`; FK obligatorias `id_viaje` e `id_trayecto`; `orden`; `kilometros` históricos; `observacion`. Las cuatro FK de ubicaciones pertenecen ahora al catálogo, no al tramo.
- Cada extremo selecciona exactamente una ubicación. El recorrido empieza en una gasolinera hacia un terminal; no exige retorno al origen. Los números de orden comienzan en 1 y son consecutivos. La continuidad y las visitas a terminales antes de las entregas se validan al finalizar la transacción.
- `categoria_producto.es_llanta` identifica las categorías que requieren condición sin depender de nombres o IDs. No puede cambiarse si la categoría tiene productos.
- `producto.condicion_llanta`: `NUEVA` o `REENCAUCHADA`, obligatoria para llantas, nula para otros productos. Cada medida/condición tiene su propio producto. Medida y condición no pueden cambiarse si hay historial.
- `detalle_mantenimiento.origen_producto`: `INVENTARIO` (predeterminado, también para registros existentes) o `EXTERNO`. `id_producto` ahora es opcional: obligatorio para inventario y nulo para externos. `descripcion_producto` es obligatoria para externos.
- Las salidas vinculadas a mantenimiento deben coincidir con un material de inventario, producto y cantidad. Un material con movimientos no puede cambiar de origen, producto o cantidad.

## Instalación

Para una base vacía ejecutar `schema.sql` y opcionalmente `seed.sql`. No ejecutar después las migraciones históricas.
La migración 010 documenta una versión anterior sin catálogo de trayectos. Para esta versión se recreó la base por autorización del usuario, usando directamente schema.sql; no aplicar migraciones históricas después. No se incluye una migración de datos desde la versión 010.
La migración elimina viajes y entregas sin reconstruir distancias desconocidas. Se detiene si existen liquidaciones, costos o gastos asociados. Conserva las demás operaciones. La clasificación inicial de «Llanta para tanquero», 11R22.5, como NUEVA fue confirmada por el usuario.

## Backend adaptado

Los endpoints de viajes utilizan `fecha_inicio`, `fecha_fin` y `tramos`, con un modelo propio e inserción transaccional. El contrato anterior con `fecha` ya no es compatible. Consultas y anulaciones incluyen los tramos, y el total de kilómetros se calcula en PostgreSQL.
Los CRUD de categorías y productos admiten `es_llanta` y `condicion_llanta`. Los mantenimientos admiten materiales externos y las anulaciones revierten únicamente los movimientos existentes. Ver ejemplos en `server/VIAJES.md` y `server/RECORRIDOS_Y_MATERIALES.md`.
La configuración y el cálculo automático de costos no forman parte de esta migración.

Validación específica: desde `server`, ejecutar `node --test test/esquema-recorridos.test.js`. Crea un esquema temporal y revierte todas las pruebas.

El catálogo de trayectos está definido y el registro de viajes lo consulta, pero su CRUD se implementará en el siguiente paso. No se cargaron datos iniciales tras recrear la base local.
