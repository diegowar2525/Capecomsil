# Seguimiento de mantenimiento por kilometraje

Requiere el `database/schema.sql` actualizado. Esta entrega no modifica la base de trabajo:
el esquema completo es para bases vacías y no sustituye una migración de datos existentes.

## Kilómetros del vehículo

`GET /api/vehiculos/:id/kilometraje`

Filtro opcional: `fecha_hasta=2026-10-16T18:00:00` (hora local sin zona).
Sin filtro, utiliza la hora actual de America/Guayaquil.

Devuelve `kilometraje_base`, `fecha_inicio_control_km`, `fecha_corte`,
`kilometros_acumulados`, `kilometraje_estimado` y `estado_control`.
El cálculo suma los kilómetros históricos de TRAMO_VIAJE para viajes REGISTRADOS
iniciados desde el comienzo del control y finalizados hasta la fecha de corte inclusive.
Los viajes anulados o anteriores al control no se cuentan. Un viaje aún no terminado
no aporta kilómetros parciales. No se consultan las distancias actuales del catálogo.

Si falta el origen del control, o el corte es anterior a él, el resultado es
`SIN_CONFIGURAR` con kilometraje nulo, no un falso cero.
El inicio del control no puede quedar dentro de un viaje. La base y el inicio se
configuran juntos desde el CRUD de vehículos; cuando existen cumplimientos quedan
protegidos para no cambiar la escala histórica. Los ceros del seed son provisionales.

## Planes por vehículo

| Método y ruta | Operación |
|---|---|
| `GET /api/planes-mantenimiento` | Planes con seguimiento y avisos |
| `GET /api/planes-mantenimiento/:id` | Plan con seguimiento |
| `POST /api/planes-mantenimiento` | Crear plan |
| `PUT /api/planes-mantenimiento/:id` | Modificar plan completo |
| `DELETE /api/planes-mantenimiento/:id` | Eliminar solo si no tiene cumplimientos |

Ejemplo de body:

```json
{
  "id_vehiculo": 1,
  "nombre": "Mantenimiento de 8.000 km",
  "intervalo_km": "8000.00",
  "kilometraje_referencia_inicial": "0.00",
  "anticipacion_aviso_km": "1000.00",
  "estado": true,
  "observacion": "Referencia de desarrollo; confirmar antes de operar"
}
```

La referencia inicial representa el último servicio anterior al seguimiento y no
puede superar el kilometraje base del vehículo cuando está configurado. El plan
puede crearse sin control configurado, pero no registrar cumplimientos hasta configurarlo.
Un vehículo puede tener varios planes independientes, como 8.000 y 80.000 km.

Filtros de consulta: `id_vehiculo`, `estado=true|false`, `situacion` y `fecha_hasta`.
Ejemplo: `/api/planes-mantenimiento?id_vehiculo=1&estado=true&situacion=VENCIDO`.

El resultado incluye el último mantenimiento válido, su kilometraje aplicado,
`kilometraje_actual`, `kilometraje_referencia`, `proximo_mantenimiento_km`,
`kilometros_restantes`, `kilometros_excedidos` y `situacion`:

- `AL_DIA`: todavía está fuera del margen de aviso.
- `PROXIMO`: faltan como máximo los kilómetros de anticipación configurados.
- `VENCIDO`: alcanzó o superó el kilometraje del próximo servicio.
- `INACTIVO`: plan desactivado, sin borrar su historial.
- `SIN_CONFIGURAR`: no se puede calcular el kilometraje para ese corte.

Próximo servicio = kilometraje del último mantenimiento válido + intervalo.
Sin mantenimiento válido se utiliza la referencia inicial. El último se determina
por fecha de finalización, no por orden de registro. Intervalos y anticipación
son configurables; sus cambios afectan al seguimiento con la configuración actual,
sin modificar el kilometraje aplicado de los servicios. Un plan utilizado no admite
cambiar de vehículo ni de referencia inicial; puede desactivarse.

Los avisos son resultados de consulta: no crean mantenimientos, no consumen inventario
y no bloquean viajes por kilometraje vencido.

## Indicar los planes cumplidos

Al crear un mantenimiento ya finalizado, añadir `planes_cumplidos: [1, 2]` al body.
Si está abierto, indicar los planes al finalizarlo:

```http
POST /api/mantenimientos/1/finalizar
Content-Type: application/json

{
  "fecha_fin": "2026-10-16T13:00:00",
  "planes_cumplidos": [1, 2]
}
```

También pueden añadirse después a un mantenimiento finalizado:

```http
POST /api/mantenimientos/1/cumplimientos
Content-Type: application/json

{"planes_cumplidos": [1]}
```

Los IDs son de planes, no de productos. Deben estar activos y pertenecer al mismo
vehículo del mantenimiento. No se repiten planes ni se certifican mantenimientos
abiertos o anulados. Cumplir uno no reinicia los demás. Omitir la lista no cumple ningún plan.

El servidor calcula `kilometraje_aplicado` al inicio del mantenimiento, usando los
viajes que terminaron hasta ese instante. No se recibe ni confía en un kilometraje
manual. La consulta individual del mantenimiento devuelve `cumplimientos`.
Registrar el mantenimiento, sus consumos y cumplimientos es transaccional; al finalizar,
una asociación inválida revierte también la fecha final. Añadir un cumplimiento no
vuelve a consumir materiales. Los consumos mantienen sus reglas actuales.

## Correcciones e historial

Registrar o anular un viaje anterior a un servicio recalcula los kilometrajes de
cumplimientos válidos posteriores dentro de la misma transacción. También se
reconcilian cambios de tramos por medio de triggers diferidos. No se mantiene un
segundo contador editable.

Anular un mantenimiento conserva sus cumplimientos como historial, pero los excluye
del seguimiento; vuelve a contar el servicio válido anterior o la referencia inicial.
Los cumplimientos de mantenimientos anulados conservan su valor registrado.
Las consultas históricas usan los viajes actualmente válidos y la configuración
actual del plan, no una fotografía de lo que el sistema conocía en aquella fecha.

Errores: 400 para datos inválidos, 404 para registros inexistentes y 409 para planes
incompatibles, cumplimientos duplicados o cambios que afecten referencias protegidas.

## Verificación

`node --test test/seguimiento-mantenimiento.test.js` verifica umbrales, planes
independientes, límites temporales, configuración ausente, finalización, anulaciones,
registro retroactivo, protección de referencias y cumplimientos concurrentes.
`npm test` ejecuta la suite completa usando esquemas de prueba.
