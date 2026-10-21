# Plan acordado: usuarios, edición y cierres

1. Usuarios, roles, permisos y sesiones: implementado (migración 014).
2. Autenticación: implementada, con login por nombre de usuario, cookie HttpOnly,
   cambio de contraseña, vencimiento y control de intentos (015).
3. Protección de rutas: implementada, con permisos, CSRF y revocación de sesiones (016).
4. Administración de usuarios y auditoría: implementada, exclusiva del jefe,
   con protección del último jefe activo (017).
5. Edición de viajes: implementada, con cabecera, entregas, tramos, recálculos,
   control de versiones y autoría en una transacción (018).
6. Cierre operativo: pendiente. Cierre manual solo del jefe o automático a las
   18:00 del día siguiente, hora de Ecuador. Bloquea altas, edición y anulación de
   viajes; gastos y abastecimientos siguen disponibles. El jefe reabre con motivo;
   jefe y operadores corrigen hasta las 18:00 del día siguiente a la reapertura,
   salvo cierre manual anterior. El vencimiento debe comprobarse en cada escritura,
   además del proceso automático de registro del cierre.
7. Frontend e integración: pendientes login, gestión de usuarios, operaciones según
   permisos y estado del día. Las pruebas backend de los pasos implementados ya
   usan sesiones y permisos.

La importación histórica de Excel queda para después: operación exclusiva del jefe,
separada del registro diario, con previsualización, confirmación y trazabilidad.
No se cambia por ahora el rango libre de fechas previsto para las liquidaciones.

Las migraciones preparadas en el repositorio no confirman la versión instalada en
la base de trabajo; deben revisarse y aplicarse en orden cuando corresponda.
