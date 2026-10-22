# API de liquidaciones: consultas y borradores

Base: `/api/liquidaciones`. Todas las rutas son exclusivas de JEFE, incluidas
las consultas. Requieren sesión válida; las escrituras exigen JSON y
`X-CSRF-Protection: 1`. En navegador enviar `credentials: "include"`.
Ver [AUTORIZACION.md](AUTORIZACION.md).

## Rutas implementadas

| Método y ruta | Permiso | Resultado |
| --- | --- | --- |
| GET `/entregas-disponibles` | `liquidaciones.consultar` | Resumen y entregas elegibles |
| GET `/` | `liquidaciones.consultar` | Lista de cabeceras |
| GET `/:id` | `liquidaciones.consultar` | Cabecera y `detalles` |
| POST `/` | `liquidaciones.crear` | Crea BORRADOR, HTTP 201 |
| PUT `/:id` | `liquidaciones.editar` | Actualiza BORRADOR, HTTP 200 |

## Consultar entregas disponibles

Ejemplo:

```text
GET /api/liquidaciones/entregas-disponibles?id_gasolinera=1&periodo_inicio=2026-10-01&periodo_fin=2026-10-31
```

Los tres parámetros son obligatorios. El intervalo es libre, incluye ambos días
y filtra por la fecha de inicio del viaje; no exige un mes calendario.
Solo admite entregas de viajes registrados, de esa gasolinera, sin asociación
a otra liquidación no anulada.

Para editar, agregar `id_liquidacion`: debe existir y estar en BORRADOR.
Incluye también sus propias entregas si cumplen los filtros y las identifica
con `seleccionada: true`. Las demás aparecen con `seleccionada: false`.

La respuesta contiene `cantidad`, `total_galones`, `valor_transporte` y `entregas`.
Cada entrega incluye sus identificadores y datos del viaje, galones, tarifa e
importe. No se pagina esta consulta. Sin resultados devuelve cantidad cero,
totales `"0.00"` y una lista vacía. Consultar no reserva entregas: al guardar
se vuelve a comprobar su disponibilidad.

## Crear borrador

```json
{
  "id_gasolinera": 1,
  "periodo_inicio": "2026-10-01",
  "periodo_fin": "2026-10-31",
  "observacion": "Entregas de octubre"
}
```

Sin `id_detalles_viaje`, selecciona todas las entregas disponibles al guardar.
Para seleccionar algunas, agregar por ejemplo `"id_detalles_viaje": [12, 15]`.
La lista explícita debe ser no vacía, sin duplicados y contener entregas elegibles.
La observación es opcional.

Devuelve la cabecera completa, `version: 1` y `detalles`. Los detalles conservan
copias históricas de galones, tarifa e importe de transporte de cada entrega.
Los totales se calculan en PostgreSQL con valores decimales; los campos NUMERIC
se devuelven como cadenas. `retencion` y `recargo` quedan en `"0.00"`, y
`total_liquidacion` equivale a `valor_transporte`.

No se aceptan importes, tarifas, estado, fechas de transición ni otros campos
calculados en el cuerpo. Si no hay entregas para la selección automática,
responde 409; una lista explícita vacía responde 400.

## Editar borrador

Consultar primero la liquidación y enviar su versión actual:

```json
{
  "id_gasolinera": 1,
  "periodo_inicio": "2026-10-01",
  "periodo_fin": "2026-10-31",
  "observacion": "Selección corregida",
  "id_detalles_viaje": [12],
  "version": 1
}
```

PUT exige gasolinera, período, versión y la lista completa de entregas deseadas.
Omitir observación la deja vacía. Puede cambiar gasolinera o período si toda la
selección corresponde a los nuevos valores. Las entregas conservadas mantienen
sus detalles e importes históricos; las añadidas generan nuevos detalles.
Las retiradas se liberan y los totales se recalculan. La versión aumenta en uno.

`id_detalles_viaje: []` vacía el borrador y deja sus totales en cero. La cabecera
se conserva; no existe DELETE. Una versión desactualizada devuelve 409: volver
a consultar y revisar los cambios antes de reenviar.

Solo se editan borradores. Un borrador preexistente con retención o recargo
distintos de cero devuelve 409 para evitar borrar esos ajustes mientras su
gestión no esté implementada.

## Reservas y consistencia

Una entrega incluida en un borrador ya está reservada: no puede incorporarse a
otra liquidación no anulada. También impide editar o anular el viaje asociado
según las protecciones del módulo de viajes. Retirarla del borrador elimina
esa reserva; otras entregas del mismo viaje podrían seguir bloqueándolo.

La creación y edición usan una transacción y el mismo bloqueo que las operaciones
de viajes. Un fallo revierte cabecera, detalles y totales. Dos creaciones que
compiten por la misma entrega no pueden reservarla ambas; dos ediciones con
la misma versión no pueden sobrescribirse silenciosamente.

Las entregas asociadas solamente a liquidaciones anuladas vuelven a estar
disponibles. Sus detalles históricos anteriores se conservan.

## Listado y detalle

GET `/` admite filtros opcionales `id_gasolinera`, `estado`, `periodo_desde`,
`periodo_hasta`, `limit` y `offset`. Estado acepta BORRADOR, ENVIADA, CONFIRMADA
o ANULADA. El rango busca períodos que se solapan con los límites indicados.
`limit` vale 50 por defecto, máximo 200; `offset` vale 0 y debe ser no negativo.
Devuelve una lista ordenada por identificador descendente.

GET `/:id` devuelve cabecera, versión y detalles históricos, junto con referencias
al viaje. Estas consultas pueden mostrar estados existentes aunque sus acciones
de transición todavía no tengan API.

## Errores y alcance pendiente

- 400: campos desconocidos, identificadores o fechas inválidos, duplicados,
  falta de versión/lista en edición o totales fuera del límite numérico.
- 401/403: sesión, permisos o protección CSRF.
- 404: liquidación o gasolinera inexistente.
- 409: entrega no disponible, período/gasolinera incompatibles con la selección,
  estado no editable, versión desactualizada o ajustes previos no admitidos.

Enviar, confirmar, anular, generar reemplazos, auditoría y exportaciones quedan
pendientes. No se crea automáticamente un reemplazo al anular. Facturación y
cobros a clientes serán módulos posteriores. El cierre operativo sigue pendiente.

## Base de datos y pruebas

Una base nueva utiliza `database/schema.sql`. En una base existente, aplicar las
migraciones pendientes en orden, incluida `020_liquidaciones_borradores.sql`:
agrega `liquidacion.version` y tres permisos exclusivos del jefe. No agrega tablas.
El servidor no migra automáticamente. Esta implementación se verificó en esquemas
temporales; no implica que se haya aplicado la migración a la base de trabajo.

`test/liquidaciones.test.js` cubre validación, permisos, reservas, valores históricos,
edición, rollback, versiones y concurrencia entre liquidaciones y viajes.
