# API de liquidaciones

Base: `/api/liquidaciones`. Todas las rutas están disponibles para JEFE y OPERADOR. Requieren sesión válida; las escrituras exigen JSON y
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
| POST `/:id/enviar` | `liquidaciones.enviar` | BORRADOR → PREPARADA, HTTP 200 |
| POST `/:id/confirmar` | `liquidaciones.confirmar` | PREPARADA → CONFIRMADA, HTTP 200 |
| POST `/:id/anular` | `liquidaciones.anular` | Anula con motivo, HTTP 200 |
| DELETE `/:id` | `liquidaciones.eliminar` | Elimina solo BORRADOR, HTTP 200 |

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
se devuelven como cadenas. Al guardar, `retencion` es el 1% del transporte si
la gasolinera es agente de retención (redondeado a dos decimales), o cero.
`recargo` suma los conceptos manuales; `total_liquidacion = valor_transporte - retencion + recargo`.
La factura copia esos importes sin volver a aplicar retención.

`recargos` es una lista opcional (hasta 100 elementos):
```json
[{ "concepto": "Costos por falta de cupo", "importe": "20.00", "id_viaje": null }]
```
El concepto es obligatorio (hasta 250 caracteres), el importe debe ser positivo,
con hasta dos decimales. El viaje es opcional; si se indica, debe estar anulado y
contener una entrega para esa gasolinera. No se convierte en entrega liquidada.
Los recargos no llevan retención. Se conservan como parte del documento al prepararlo.

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

`id_detalles_viaje: []` vacía las entregas del borrador y deja transporte y retención en cero; los recargos enviados se conservan. No puede prepararse sin entregas. La cabecera
se conserva; para eliminarla usar DELETE. Una versión desactualizada devuelve 409: volver
a consultar y revisar los cambios antes de reenviar.

Solo se editan borradores. PUT reemplaza la lista completa de `recargos`; omitirla equivale a una lista vacía. Los importes y la tasa se recalculan al guardar.

## Enviar, confirmar, anular y eliminar

Todas estas acciones requieren la versión actual. Para enviar o confirmar:

```json
{ "version": 2 }
```

Enviar registra PREPARADA y `fecha_envio`; no envía correos ni documentos.
Exige al menos una entrega, copias históricas coherentes y totales correctos.
No recalcula silenciosamente importes inconsistentes. Si cambió la condición de agente de retención, exige guardar nuevamente el borrador antes de prepararlo. Después del envío no se pueden editar
la cabecera ni los detalles. Confirmar solo admite PREPARADA y registra
CONFIRMADA y `fecha_confirmacion`; no emite una factura ni registra un cobro.
No hay confirmación automática ni plazo predeterminado: `fecha_limite_confirmacion`
no se modifica mediante estas acciones.

Para anular:

```json
{ "version": 4, "motivo": "Corrección de las entregas" }
```

Admite únicamente PREPARADA o CONFIRMADA, siempre que no exista factura vigente asociada.
Un BORRADOR devuelve 409 y se conserva sin cambios; puede eliminarse con DELETE.
El motivo es obligatorio, se recortan espacios externos y admite hasta 150
caracteres. Registra ANULADA, `fecha_anulacion` y `motivo_anulacion`, conserva
los importes y detalles y libera las entregas. No crea una nueva liquidación.
ANULADA es definitiva: no se edita, reactiva ni elimina.

Cada transición devuelve la liquidación completa e incrementa su versión.
Las fechas las asigna PostgreSQL al ejecutar la acción; no se reciben del cliente.
Repetir una acción ya aplicada o usar una versión antigua devuelve 409.

DELETE también recibe JSON `{ "version": 2 }` y requiere la protección CSRF.
Solo elimina BORRADOR sin factura asociada: primero elimina sus detalles y
después su cabecera, dentro de la misma transacción, liberando las entregas.
Devuelve `{ "id_liquidacion": 7 }` con el identificador eliminado. Consultarlo
o eliminarlo nuevamente devuelve 404. No elimina viajes ni entregas originales.

## Reservas y consistencia

Una entrega incluida en un borrador ya está reservada: no puede incorporarse a
otra liquidación no anulada. También impide editar o anular el viaje asociado
según las protecciones del módulo de viajes. Retirarla del borrador elimina
esa reserva; otras entregas del mismo viaje podrían seguir bloqueándolo.

La creación, edición, transiciones y eliminación usan una transacción y el mismo bloqueo que las operaciones
de viajes. Un fallo revierte cabecera, detalles y totales. Dos creaciones que
compiten por la misma entrega no pueden reservarla ambas; dos ediciones con
la misma versión no pueden sobrescribirse silenciosamente.

Las entregas asociadas solamente a liquidaciones anuladas vuelven a estar
disponibles. Sus detalles históricos anteriores se conservan.

## Listado y detalle

GET `/` admite filtros opcionales `id_gasolinera`, `estado`, `periodo_desde`,
`periodo_hasta`, `limit` y `offset`. Estado acepta BORRADOR, PREPARADA, CONFIRMADA
o ANULADA. El rango busca períodos que se solapan con los límites indicados.
`limit` vale 50 por defecto, máximo 200; `offset` vale 0 y debe ser no negativo.
Devuelve una lista ordenada por identificador descendente.

GET `/:id` devuelve cabecera, versión y detalles históricos, junto con referencias
al viaje, además de las fechas de preparación, confirmación y anulación cuando correspondan.

## Errores y alcance pendiente

- 400: campos desconocidos, identificadores o fechas inválidos, duplicados,
  falta de versión/lista en edición o totales fuera del límite numérico.
- 401/403: sesión, permisos o protección CSRF.
- 404: liquidación o gasolinera inexistente.
- 409: entrega no disponible, período/gasolinera incompatibles con la selección,
  estado incompatible, versión desactualizada, factura asociada, preparación sin
  entregas, totales inconsistentes o ajustes previos no admitidos.

Generar reemplazos y la auditoría de cambios quedan pospuestos por decisión del
usuario. Las exportaciones y el cierre operativo siguen pendientes. Facturas y
cobros están implementados: ver [FACTURACION_CLIENTES.md](FACTURACION_CLIENTES.md).

## Base de datos y pruebas

Una base nueva utiliza `database/schema.sql`. En una base existente, aplicar las
migraciones pendientes en orden, incluida `020_liquidaciones_borradores.sql`:
agrega `liquidacion.version` y tres permisos exclusivos del jefe. Después aplicar
`021_liquidaciones_acciones.sql`: agrega cuatro permisos exclusivos del jefe y
actualiza la protección de estados para controlar versiones y permitir borrar
borradores. Ninguna de estas migraciones agrega tablas.
El servidor no migra automáticamente. Esta implementación se verificó en esquemas
temporales; no implica que se haya aplicado la migración a la base de trabajo.

`test/liquidaciones.test.js` cubre validación, permisos, reservas, valores históricos,
edición, transiciones, eliminación, bloqueo por factura, rollback, versiones y
concurrencia entre liquidaciones y viajes.

La migración `022_liquidaciones_no_anular_borrador.sql` actualiza el trigger para rechazar también la anulación directa por SQL de un borrador.

La migración 028 amplía los permisos de liquidaciones a OPERADOR y permite anular una liquidación PREPARADA/CONFIRMADA cuando todas sus facturas estén anuladas. Conserva facturas y entregas históricas.

La transición antes llamada Enviar ahora se presenta como Marcar como preparada. Se conserva `/enviar`, `liquidaciones.enviar` y `fecha_envio` por compatibilidad; representan preparación, sin envío de documentos. Aplicar migración 035 para bases existentes. El listado permite preparar y confirmar desde Estado; el detalle muestra progreso, fechas y motivo de anulación.

## Modal de estado y reapertura
El ícono de estado abre el modal de progreso, fechas e historial. Preparar y confirmar se realizan allí. POST `/:id/reabrir` requiere `liquidaciones.editar` y `{version}`; solo admite PREPARADA y devuelve BORRADOR sin liberar entregas. La fecha de preparación se limpia y se registra nuevamente al preparar. GET `/:id` incluye `historial`, con estados anterior/nuevo, fecha, usuario y versión. Aplicar migración 036 después de 035. El historial comienza con esta actualización; no reconstruye transiciones anteriores. No se exige motivo de reapertura.
