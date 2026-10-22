# Autorización: etapa 3

Todas las rutas operativas bajo `/api` requieren una sesión válida y el permiso
declarado en la ruta. `/api/health` es público. `/api/auth` conserva sus controles
propios: login público, sesión actual y cambio de contraseña autenticados, logout
idempotente. No existe registro público de cuentas.

## Peticiones

En navegador enviar `credentials: "include"`. Toda escritura (POST, PUT, PATCH y
DELETE) exige `Content-Type: application/json` y `X-CSRF-Protection: 1`, incluso
DELETE sin cuerpo. Si se envía Origin, debe estar en `AUTH_ORIGINS`. Estos requisitos
también se aplican a los ejemplos de las guías anteriores de cada módulo.

- 401: falta sesión o está vencida/revocada, o el usuario está inactivo.
- 403: falta permiso, debe cambiarse la contraseña o falla la protección CSRF.
- Con `requiere_cambio_password`, se bloquean las rutas operativas, incluidas las
  consultas. Permanecen disponibles `/auth/me`, `/auth/password` y `/auth/logout`.

El rol y sus permisos se consultan en cada petición. JEFE no tiene una excepción
que omita permisos: necesita su asignación como cualquier usuario. Las respuestas
autenticadas llevan `Cache-Control: no-store`.

## Permisos por operación

| Rutas / módulo | Prefijo de permiso |
| --- | --- |
| Vehículos, choferes, gasolineras, terminales, trayectos, proveedores, productos y categorías | `catalogos` |
| Tarifas | `tarifas` |
| Configuraciones de remuneración, combustible, viáticos, peajes y feriados | `configuraciones` |
| Viajes | `viajes` |
| Facturas de proveedores | `compras` |
| Recepciones de compra | `recepciones` |
| Inventario | `inventario` |
| Mantenimientos y planes | `mantenimientos` / `planes_mantenimiento` |
| Gastos y abastecimientos | `gastos` / `abastecimientos` |
| Pagos a proveedores | `pagos_proveedor` |
| Informes y remuneraciones | `informes` / `remuneraciones` |
| Liquidaciones (solo JEFE, incluidas consultas) | `liquidaciones` |

Las consultas usan `.consultar`; los CRUD existentes usan `.crear`, `.editar` y
`.eliminar`. Las acciones declaran su permiso específico: `.anular`, `.revertir`,
`.ajustar`, `.finalizar`, `.registrar_cumplimientos` o `.generar`.

Las consultas anidadas de pagos y cuentas por pagar requieren
`pagos_proveedor.consultar`, aunque estén bajo facturas o proveedores. Las consultas
de recepciones y pendientes de recepción bajo facturas requieren `recepciones.consultar`.

OPERADOR mantiene sus operaciones habituales y consulta tarifas/configuraciones.
Solo JEFE tiene asignados sus permisos de modificación y los administrativos.
El módulo de liquidaciones también es exclusivo del jefe: `liquidaciones.consultar`,
`liquidaciones.crear` y `liquidaciones.editar`, agregados por la migración 020.
La migración 021 agrega `liquidaciones.enviar`, `liquidaciones.confirmar`,
`liquidaciones.anular` y `liquidaciones.eliminar`, también exclusivos del jefe.
OPERADOR no puede consultar ni modificar liquidaciones.
Las consultas administrativas disponibles son:

| Rutas GET | Permiso |
| --- | --- |
| `/api/usuarios`, `/api/usuarios/:id` | `usuarios.consultar` |
| `/api/roles`, `/api/roles/:id` | `roles.consultar` |
| `/api/permisos`, `/api/permisos/:id`, `/api/roles/:id/permisos` | `permisos.consultar` |

No se devuelven hashes de contraseñas ni tokens. Crear, editar, desactivar y
restablecer cuentas por HTTP está implementado en la etapa 4:
[ADMINISTRACION_USUARIOS.md](ADMINISTRACION_USUARIOS.md).

Los endpoints antiguos de cerrar/reabrir remuneraciones fueron retirados.
Los permisos `cierres.*` se conservan para el futuro cierre operativo.
La edición de viajes usa `viajes.editar` y su historial `viajes.consultar`:
ver [VIAJES.md](VIAJES.md). El cierre del día operativo y la importación histórica
aún no están implementados; disponer de sus permisos no los habilita.

## Instalación y verificación

Una base nueva usa `database/schema.sql`. Una base actualizada hasta la 015 debe
aplicar `database/migrations/016_revocacion_sesiones_usuario.sql`. El trigger revoca
todas las sesiones al desactivar una cuenta o cambiar su hash de contraseña;
reactivar la cuenta no recupera sesiones anteriores. El servidor no ejecuta
migraciones automáticamente.

Las pruebas HTTP operativas usan sesiones reales en esquemas temporales. La suite
verifica permisos declarados en todas las rutas, rechazo de accesos anónimos,
restricciones por rol, CSRF, cambio obligatorio de contraseña y revocación.
