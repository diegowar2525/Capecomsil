# 034 — Remuneraciones automáticas

Aplicar una vez sobre una base existente. schema.sql ya incluye estos cambios para instalaciones nuevas.

## Período laboral

Chofer incorpora fecha_inicio_trabajo y fecha_fin_trabajo (último día incluido). Los registros anteriores conservan ambas fechas vacías: no se inventa antigüedad. La creación por API exige inicio; fin es opcional. Una vez informado el inicio no se puede vaciar desde la API. Completar las fechas en el catálogo de choferes.

Desactivar el catálogo no determina cuándo dejó de trabajar: informar la fecha de fin para detener el devengo. Al corregir las fechas, se recalculan los registros existentes; los días fuera del período quedan con importe cero y sus asignaciones se actualizan. No se eliminan registros. Se conservan las configuraciones históricas ya aplicadas.

## Ejecución

server/src/jobs/remuneraciones.job.js se inicia con server.js (también bajo nodemon), al arrancar y después cada hora. Completa los días hasta ayer según America/Guayaquil, incluido el atraso por reinicios. Procesa hasta 366 fechas por chofer en cada transacción; si hay volumen de atraso, repite al minuto. No requiere cierre operativo. Varias instancias usan el bloqueo transaccional existente y la unicidad chofer/fecha.

Genera tanto diario fijo como día trabajado. Diario fijo: lunes a sábado incluso sin viajes; domingo solo si trabajó. Día trabajado: importe base cuando tiene viajes válidos. Se mantienen adicionales y distribución entre viajes existentes. No registra pagos. El día actual puede contener remuneración calculada por viajes, pero no se considera completo.

Sin inicio laboral no se activa la tarea. Sin configuración de remuneración vigente, ese día queda pendiente y se reintenta automáticamente; otros días/choferes pueden continuar. El servidor debe estar ejecutándose para procesar; al volver a arrancar recupera pendientes.

## API y pantalla

GET /api/remuneraciones-chofer/cobertura?id_chofer=1&fecha_desde=2026-10-01&fecha_hasta=2026-10-31 devuelve fecha_inicio_trabajo, fecha_fin_trabajo, hasta_procesable y dias_pendientes. Requiere remuneraciones.consultar. Es lectura, no genera registros.

La pantalla no ofrece creación ni generación manual; suma el período completo consultado y advierte si falta inicio o hay días pendientes. El POST /generar anterior se conserva por compatibilidad, no se utiliza desde la interfaz.

Remuneraciones de choferes, Costos de viaje e Informes se agrupan en Consultas e informes.
