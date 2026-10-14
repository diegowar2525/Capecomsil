# Remuneraciones de choferes

Cada viaje recibe `fecha: "2026-10-13"`. Ya no se aceptan `fecha_inicio` ni `fecha_fin`.
Registrar o anular un viaje recalcula el importe diario y sus asignaciones dentro de la misma transacción.

## Reglas con la configuración inicial de $35 + $35

| Situación | DIARIO_FIJO | DIA_TRABAJADO |
|---|---:|---:|
| Lunes–sábado normal sin viajes | 35 | 0 |
| Feriado lunes–sábado sin viajes | 35 | 0 |
| Domingo sin viajes | 0 | 0 |
| Día normal con uno o más viajes | 35 | 35 |
| Domingo o feriado con uno o más viajes | 70 | 70 |

Domingo y feriado simultáneos no duplican el adicional. Trabajar significa tener al menos un viaje REGISTRADO.
La vigencia inicial del seed y la migración comienza el 2026-01-01; fechas anteriores requieren configuración explícita.
Los feriados no vienen precargados: deben registrarse antes de generar remuneraciones de esas fechas.

Con tres viajes en un día normal, las asignaciones son 11.67, 11.67 y 11.66, ordenadas por ID de viaje.
Se calcula en PostgreSQL con NUMERIC y centavos enteros, sin aritmética binaria de JavaScript.
Mientras el día está abierto, registrar o anular viajes redistribuye sus costos. La remuneración diaria conserva
la modalidad y configuración que utilizó por primera vez. La anulación del último viaje elimina sus asignaciones,
pero puede dejar un costo diario sin asignar para un chofer fijo.

**No sumar remuneración diaria y sus costos asignados en un mismo reporte de gastos:** representan el mismo importe.
Para rentabilidad de un viaje se utiliza COSTO_VIAJE; para gasto de choferes por período se suma REMUNERACION_CHOFER.total.

## API

`/api/configuraciones-remuneracion`: GET lista, GET /:id, POST, PUT /:id, DELETE /:id.

```json
{
  "importe_diario": "35.00",
  "adicional_dia_especial": "35.00",
  "fecha_inicio": "2026-01-01",
  "fecha_fin": null,
  "observacion": null
}
```

Para aumentar el importe: cerrar la vigencia anterior con PUT sin cambiar sus importes y crear la siguiente con POST.
Ambos límites son inclusivos. No se permite modificar importes ya utilizados ni eliminar configuraciones con historial.

`/api/feriados`: GET lista, GET /:id, POST, PUT /:id, DELETE /:id.

```json
{ "fecha": "2026-12-25", "descripcion": "Navidad", "observacion": null }
```

`POST /api/remuneraciones-chofer/generar` genera/recalcula el período explícito de un chofer (máximo 366 días).
Incluye días sin viajes y es idempotente: no duplica fechas. No se infiere fecha de contratación del chofer.
El operador debe elegir únicamente su período de actividad; una configuración faltante revierte toda la operación.

```json
{ "id_chofer": 1, "fecha_desde": "2026-10-01", "fecha_hasta": "2026-10-31" }
```

`GET /api/remuneraciones-chofer?id_chofer=1&fecha_desde=2026-10-01&fecha_hasta=2026-10-31`
consulta lo ya generado. `GET /api/remuneraciones-chofer/:id` consulta un día.
Incluyen `total`, `costo_asignado`, `costo_sin_asignar`, modalidad y estado. Los importes se devuelven como texto decimal.
GET de un viaje y POST de creación incluyen `costos` con sus asignaciones actuales.

`POST /api/remuneraciones-chofer/:id/cerrar` y `/:id/reabrir` devuelven **403**.
No existe clave provisional ni campo de rol que permita saltarse el bloqueo. PostgreSQL también impide cambiar el estado a CERRADO.
El historial está preparado, pero su escritura y las autorizaciones se implementarán con usuarios.

## Transacciones y despliegue

Aplicar una sola vez `database/migrations/012_remuneracion_diaria.sql` a una base anterior y desplegar el backend actualizado conjuntamente.
La migración conserva datos y rechaza viajes antiguos de varios días o costos CHOFER manuales que requieran conciliación.
Para instalación nueva: `schema.sql`, después `seed.sql`; no ejecutar además las migraciones anteriores.

Las operaciones de remuneración y los cambios de configuración/calendario toman el mismo candado transaccional de PostgreSQL
antes de bloquear filas. Esto evita repartos perdidos en peticiones concurrentes, a costa de serializar estas operaciones.
La creación de viajes sigue verificando recorrido, capacidad y tarifa por fecha. No cambia el inventario.
Los costos automáticos de combustible, peajes y viáticos y los pagos a choferes quedan fuera de este módulo.
