# 038 — Fechas operativas sin horas

Aplicar `038_fechas_operativas.sql` una vez, después de las migraciones anteriores,
antes de utilizar esta versión del servidor y del frontend. El esquema consolidado
ya incorpora el cambio para instalaciones nuevas.

- `viaje.fecha_inicio` y `mantenimiento.fecha_inicio` pasan a `DATE`.
- Se conserva el día de inicio original, sin conversiones de zona horaria.
- Se eliminan las horas y las columnas `fecha_fin`. Respaldar la base antes de
  ejecutar: esos valores no se pueden recuperar con una migración inversa.
- No se cambian las fechas de auditoría ni las horas de abastecimientos.
- Se retiran las restricciones de solapamiento de viajes y mantenimientos.
  Varios viajes del mismo vehículo/chofer pueden compartir día y un mantenimiento
  no impide registrar viajes.
- La API recibe `fecha_inicio: "2026-11-07"`; rechaza horas y `fecha_fin`.
- Ya no existe la acción de finalizar mantenimiento. Un preventivo registrado
  puede vincular planes al crearlo o posteriormente mediante `/cumplimientos`.

El kilometraje incluye todos los viajes válidos desde el día del control hasta el
día consultado inclusive. Los cumplimientos de mantenimientos vigentes se recalculan
con ese criterio; sus asociaciones se conservan. Los historiales JSON existentes
se conservan como evidencia de los valores anteriores.

En consumo de combustible se conserva el cálculo real entre cargas completas.
Si existen viajes el mismo día que alguna de las cargas límite, no es posible
saber si ocurrieron antes o después: se devuelve `VIAJES_CRUZAN_LIMITES` y no se
calcula desviación. No se asignan horarios ficticios a los viajes.
