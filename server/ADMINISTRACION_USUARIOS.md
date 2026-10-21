# Administración de usuarios: etapa 4

Disponible exclusivamente para JEFE con el permiso correspondiente. Usa las
sesiones y la protección CSRF descritas en [AUTORIZACION.md](AUTORIZACION.md).
El actor se obtiene de la sesión; no se acepta un identificador de administrador
en el cuerpo. No existe registro público ni eliminación física de cuentas.

## Endpoints

| Método y ruta | Cuerpo | Permiso | Éxito |
| --- | --- | --- | --- |
| POST `/api/usuarios` | `nombre_usuario`, `nombre`, `id_rol`, `password_temporal` | `usuarios.crear` | 201 |
| PUT `/api/usuarios/:id` | `nombre_usuario`, `nombre`, `id_rol` | `usuarios.editar` | 200 |
| PATCH `/api/usuarios/:id/estado` | `activo` booleano, `motivo` | `usuarios.desactivar` | 200 |
| POST `/api/usuarios/:id/restablecer-password` | `password_temporal`, `motivo` | `usuarios.restablecer_credenciales` | 200 |
| GET `/api/usuarios/:id/historial` | Sin cuerpo | `usuarios.consultar` | 200 |

Las escrituras devuelven el usuario público actualizado, nunca contraseñas ni hashes.
PUT exige los tres campos del perfil. No permite cambiar contraseña, estado ni
`requiere_cambio_password`; se rechazan campos adicionales. Los IDs de rol se obtienen
de GET `/api/roles`. El nombre de acceso se normaliza a minúsculas y es único.
Los motivos son obligatorios en cambios de estado y restablecimientos, con máximo
500 caracteres. No incluir contraseñas en el motivo, pues se conserva en el historial.

## Contraseña temporal

El jefe proporciona una contraseña de 15 a 128 caracteres y la comunica al usuario
fuera de esta API. Se almacena únicamente su hash scrypt. Las cuentas se crean
activas y con cambio obligatorio de contraseña, incluso si son del rol JEFE.

El usuario inicia sesión con su nombre y contraseña temporal; hasta cambiarla
solo puede consultar su sesión, cambiar la contraseña o cerrar sesión. Utiliza
PATCH `/api/auth/password` con `password_actual` y `password_nueva`; después inicia
sesión nuevamente con su contraseña personal.

Restablecer una contraseña no exige conocer la anterior: asigna otra temporal,
revoca todas las sesiones y vuelve a exigir el cambio. No reactiva una cuenta
inactiva. El jefe no puede restablecer su propia contraseña mediante esta ruta;
debe utilizar `/api/auth/password`, que exige su contraseña actual.

## Integridad e historial

- No se puede desactivar ni degradar al último jefe activo. Un bloqueo transaccional
  serializa la administración y protege esta regla ante solicitudes simultáneas.
- Cambiar nombre de acceso o rol revoca todas las sesiones del usuario afectado.
  Cambiar solo el nombre personal conserva sus sesiones.
- Desactivar revoca sesiones. Reactivar conserva la contraseña y la obligación de
  cambio que tuviera, sin recuperar sesiones anteriores.
- El jefe puede cambiar su propio perfil o estado si permanece otro jefe activo;
  los cambios que revocan sesiones también afectan a su sesión actual.
- La operación y su historial se confirman juntos. Si falla el historial, se revierten
  tanto los cambios como las revocaciones realizadas en esa transacción.

`usuario_historial` registra usuario afectado, actor, fecha, acción, motivo y valores
anteriores/posteriores del perfil. No guarda contraseñas, hashes ni tokens. Su GET
devuelve una lista desde el evento más reciente. No hay rutas de edición o borrado
del historial. Cubre estas operaciones administrativas, no constituye una auditoría
general de login ni de operaciones del resto del sistema.

Errores: 400 entrada inválida, 401 sesión inválida, 403 sin autorización, 404 usuario
o rol inexistente, 409 nombre duplicado o protección del último jefe.

## Base de datos

Base nueva: `database/schema.sql` (45 tablas). Base actualizada hasta la 016:
aplicar `database/migrations/017_administracion_usuarios.sql`. No aplicar migraciones
sobre el esquema nuevo completo. No se ejecutan automáticamente al arrancar.

Las pruebas usan esquemas temporales y comprueban la migración, contraseñas temporales,
restricciones de acceso, revocaciones, rollback del historial y cambios concurrentes
del último jefe. La interfaz de administración sigue pendiente en el frontend.
