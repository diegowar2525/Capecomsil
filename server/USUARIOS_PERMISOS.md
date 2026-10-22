# Usuarios y permisos: etapa 1

Se implementó la estructura de datos y las capas de consulta. La etapa 2 agrega
login, cookies, hashes y sesiones: ver [AUTENTICACION.md](AUTENTICACION.md).
La etapa 3 protege las rutas operativas con sesión y permisos y monta las consultas
de usuarios, roles y permisos, exclusivas del jefe. Ver [AUTORIZACION.md](AUTORIZACION.md).
La etapa 4 incorpora la administración de cuentas, protección del último jefe e
historial: ver [ADMINISTRACION_USUARIOS.md](ADMINISTRACION_USUARIOS.md).

## Tablas

| Tabla | Finalidad |
| --- | --- |
| `rol` | Dos roles iniciales: JEFE y OPERADOR |
| `permiso` | Código estable `modulo.accion` y marca de exclusividad del jefe |
| `rol_permiso` | Asignaciones iniciales sin duplicados |
| `usuario` | Nombre de acceso único, nombre personal, hash de contraseña, rol y estado |
| `sesion` | Usuario, resumen del token, vencimiento y revocación |

El nombre de acceso se almacena en minúsculas, con 3 a 50 caracteres ASCII:
letras, números, punto, guion y guion bajo; comienza por letra o número.
Login y creación local del primer jefe normalizan el nombre de acceso.
Las contraseñas nunca deben escribirse en texto plano en `password_hash`; la
restricción de la columna comprueba presencia, no verifica un algoritmo criptográfico.
`token_hash` reserva un resumen de 32 bytes, no la cookie ni el token original.
Los tiempos de usuarios y sesiones son TIMESTAMPTZ, independientes de los horarios
locales de viajes. La futura edición actualizará `fecha_actualizacion` explícitamente.

El esquema no crea cuentas, contraseñas de ejemplo ni sesiones. El primer jefe se
instala con `npm run crear-jefe`. La administración protege al último jefe activo
y registra sus cambios en `usuario_historial` (migración 017). La migración 016 revoca
sesiones al desactivar usuarios o cambiar sus credenciales.
No usar SQL manual como interfaz habitual de gestión de cuentas.

## Asignaciones iniciales

El jefe recibe todos los permisos definidos. El operador recibe:

- Operaciones de viajes, compras, recepciones, inventario, mantenimientos,
  planes de mantenimiento, gastos, abastecimientos y pagos a proveedores.
- Consulta y gestión de catálogos operativos, consulta de informes y
  consulta/generación de remuneraciones.
- Consulta de tarifas, configuraciones y estado de los cierres.

Son exclusivos del jefe: modificaciones de tarifas/configuraciones, gestión de
usuarios y roles/permisos, cierre y reapertura de días, e importación histórica.
`configuraciones` incluye remuneración, combustible, viáticos, peajes y feriados.
`catalogos` agrupa vehículos, choferes, gasolineras, terminales, proveedores,
productos, categorías, combustibles transportados y trayectos.
`pagos_proveedor` se refiere a los pagos existentes a proveedores; los futuros
cobros a clientes necesitarán sus propios permisos.

El permiso `viajes.editar` habilita la edición transaccional. `cierres.*` e `importaciones.*` reservan capacidades
para etapas posteriores: su existencia no habilita funcionalidades. El cierre y
la reapertura de remuneraciones fueron retirados para dejar un único cierre operativo.
Las asignaciones se cargan explícitamente al crear el esquema o aplicar la migración.
Agregar permisos nuevos requiere una migración con sus asignaciones; no se conceden
automáticamente a roles existentes.

`rol_permiso.findByRol` excluye permisos exclusivos del jefe para OPERADOR incluso
si se introduce una asignación incorrecta directamente en SQL. No sustituye al
middleware de autorización, que comprueba usuario activo, sesión y permiso en cada petición.

## Capas

- Modelos `rol`, `permiso`, `rol_permiso`, `usuario` y `sesion`: SQL parametrizado,
  conexión opcional al final; filas o null para consultas individuales.
- Servicios `usuarios`, `roles` y `permisos`: validación y errores de recurso inexistente.
- Validador de filtros de usuarios: activo, rol y paginación; IDs mediante el validador común.
- Controladores homónimos: resultado explícito, estado 200 y `next(error)`.

Las consultas públicas de usuario no seleccionan `password_hash`; las de metadatos
de sesiones no seleccionan `token_hash`. La etapa 2 agrega métodos internos para
credenciales y sesiones, sin exponer esos secretos por HTTP. Los endpoints
administrativos de consulta y mutación están protegidos por sus permisos específicos.

## Instalación

Para una base nueva, usar `database/schema.sql`: contiene 45 tablas y los catálogos
iniciales, incluida la tabla de intentos de la etapa 2. No aplicar después las
migraciones 014/015/016/017/018/019 ni duplicar estos datos en el seed.

Para una base existente actualizada hasta la migración 013, revisar y ejecutar
`database/migrations/014_usuarios_roles_permisos.sql`. Es transaccional y conserva
los datos operativos; no es una migración repetible. Si ya existen objetos con esos
nombres, falla y debe revisarse el estado antes de continuar. No se ejecuta
automáticamente al arrancar el servidor.

Las pruebas verifican tanto el esquema nuevo como la migración sobre el esquema
anterior en esquemas temporales, con rollback. Incluyen permisos iniciales, claves
foráneas, duplicados, vencimientos, ausencia de secretos en consultas y las capas
de validación, servicio y controlador.
