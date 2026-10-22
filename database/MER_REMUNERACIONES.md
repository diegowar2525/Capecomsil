# MER: fecha del viaje y remuneración diaria

Los nombres siguientes coinciden con `schema.sql`. Las entidades no enumeradas no cambian.

## Entidades existentes

### VIAJE

`id_viaje` INTEGER PK; `id_vehiculo` INTEGER FK → VEHICULO; `id_chofer` INTEGER FK → CHOFER;
`fecha_inicio` y `fecha_fin` TIMESTAMP NOT NULL; `estado` VARCHAR(30) REGISTRADO/ANULADO;
`fecha_anulacion` TIMESTAMP nullable; `motivo_anulacion` VARCHAR(150) nullable; `version` INTEGER.

Cada viaje pertenece a un único día, con hora de fin posterior a la de inicio.
El día de inicio determina la remuneración. El recorrido, las entregas y la aplicación de tarifas se conservan.

### CHOFER

Se conservan los atributos existentes. `tipo_remuneracion` admite **DIARIO_FIJO** y **DIA_TRABAJADO**.
La migración convierte SUELDO y POR_VIAJE respectivamente. La modalidad histórica se copia al registro diario.

### COSTO_VIAJE

`id_costo` INTEGER PK; `id_viaje` INTEGER FK → VIAJE; `tipo_costo` VARCHAR(100);
`valor` NUMERIC(12,2); `descripcion` TEXT nullable;
**`id_remuneracion_chofer` INTEGER FK nullable → REMUNERACION_CHOFER**.

El vínculo es obligatorio para CHOFER y debe ser nulo para otros conceptos.
UNIQUE (`id_viaje`, `id_remuneracion_chofer`). Los importes asociados son asignaciones del costo diario.

## Entidades nuevas

### CONFIGURACION_REMUNERACION

| Atributo | Tipo / restricción |
|---|---|
| id_configuracion_remuneracion | INTEGER PK |
| importe_diario | NUMERIC(12,2), mayor que cero |
| adicional_dia_especial | NUMERIC(12,2), no negativo |
| fecha_inicio | DATE, obligatorio |
| fecha_fin | DATE, nullable, inclusive |
| observacion | TEXT, nullable |

Configuración global con períodos no superpuestos. Una configuración puede utilizarse en muchas remuneraciones.
Una vez utilizada, no se modifican sus importes ni se dejan fuera fechas ya utilizadas.

### FERIADO

| Atributo | Tipo / restricción |
|---|---|
| id_feriado | INTEGER PK |
| fecha | DATE UNIQUE, obligatorio |
| descripcion | VARCHAR(150), obligatorio |
| observacion | TEXT, nullable |

Los domingos se detectan por calendario. No requieren una fila en FERIADO.
No se altera el calendario de fechas que ya tienen remuneraciones generadas.

### REMUNERACION_CHOFER

| Atributo | Tipo / restricción |
|---|---|
| id_remuneracion_chofer | INTEGER PK |
| id_chofer | INTEGER FK → CHOFER |
| id_configuracion_remuneracion | INTEGER FK → CONFIGURACION_REMUNERACION |
| id_feriado | INTEGER FK nullable → FERIADO |
| fecha | DATE, obligatorio |
| tipo_remuneracion_aplicado | VARCHAR(20): DIARIO_FIJO / DIA_TRABAJADO |
| trabajo_realizado | BOOLEAN |
| es_domingo | BOOLEAN |
| importe_base | NUMERIC(12,2), no negativo |
| importe_adicional | NUMERIC(12,2), no negativo |
| total | NUMERIC(12,2), base + adicional |
| fecha_creacion | TIMESTAMP |
| observacion | TEXT nullable |

UNIQUE (`id_chofer`, `fecha`). Existe una remuneración por chofer y día, aunque haya varios viajes.

La migración 019 retira el estado, la fecha de cierre y el antiguo historial de cierres.
La remuneración conserva importes y configuración histórica. El cierre operativo de
viajes se implementará por separado; todavía no forma parte del esquema.

## Relaciones

```mermaid
erDiagram
    CHOFER ||--o{ VIAJE : realiza
    CHOFER ||--o{ REMUNERACION_CHOFER : genera
    CONFIGURACION_REMUNERACION ||--o{ REMUNERACION_CHOFER : determina
    FERIADO o|--o{ REMUNERACION_CHOFER : corresponde
    REMUNERACION_CHOFER o|--o{ COSTO_VIAJE : se_distribuye
    VIAJE ||--o{ COSTO_VIAJE : tiene
```

No se incluyen pagos a choferes. El cliente mantiene sus roles de pago fuera del sistema.
