# Plan acordado: usuarios, edición y cierres

Los pasos 6 y 7 quedan pospuestos por decisión del usuario. Se conservan sus reglas
como pendientes; no se implementarán en esta etapa.

1. Usuarios, roles, permisos y sesiones: implementado (migración 014).
2. Autenticación: implementada, con login por nombre de usuario, cookie HttpOnly,
   cambio de contraseña, vencimiento y control de intentos (015).
3. Protección de rutas: implementada, con permisos, CSRF y revocación de sesiones (016).
4. Administración de usuarios y auditoría: implementada, exclusiva del jefe,
   con protección del último jefe activo (017).
5. Edición de viajes: implementada, con cabecera, entregas, tramos, recálculos,
   control de versiones y autoría en una transacción (018).
6. Cierre operativo: pendiente. El cierre propio de remuneraciones fue retirado
   (migración 019), conservando importes y costos. Cierre manual solo del jefe o automático a las
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

## Liquidaciones: etapa actual

1. Contrato y permisos: implementados. Consultar, crear y editar son exclusivos
   del jefe. Migración 020: permisos y versión del borrador.
2. Entregas disponibles: implementado por gasolinera y rango libre de fechas,
   excluyendo viajes anulados y entregas en otra liquidación no anulada.
3. Borradores: creación y edición transaccionales, selección de entregas,
   copias históricas, totales y protección frente a operaciones simultáneas.
   Retención y recargo quedan en cero por decisión del usuario.

Quedan pendientes enviar, confirmar, anular, generar un reemplazo explícito y
la auditoría del módulo. Anular no creará automáticamente otro borrador.
No hay eliminación física; editar un borrador permite retirar todas sus entregas.
Contrato y ejemplos en [LIQUIDACIONES.md](LIQUIDACIONES.md).
