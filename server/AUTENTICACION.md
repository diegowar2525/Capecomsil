# Autenticación: etapa 2

La API dispone de login por nombre de usuario, sesión actual, logout y cambio de
contraseña. No hay registro público ni administración HTTP de cuentas. Las rutas
operativas todavía no exigen sesión ni permisos: su protección corresponde al paso 3.
Esta etapa por sí sola no hace que la aplicación completa esté lista para producción.

## Instalación

1. Base nueva: ejecutar `database/schema.sql` (44 tablas). Base existente con etapa 1:
   aplicar `database/migrations/015_autenticacion_intentos.sql`; si falta la etapa 1,
   aplicar antes la 014. No aplicar estas migraciones sobre el esquema nuevo completo.
2. Configurar `.env` siguiendo `.env.example`. `AUTH_ORIGINS` contiene orígenes
   exactos sin barra final. En producción es obligatorio configurar orígenes HTTPS
   y `NODE_ENV=production`. `AUTH_SESSION_HOURS` vale 12 por defecto (1 a 168).
3. Desde `server`, ejecutar `npm run crear-jefe` en una terminal interactiva. Solicita
   usuario, nombre y contraseña con confirmación y entrada oculta. No recibe
   contraseñas en argumentos ni imprime hashes. Solo funciona si no hay usuarios;
   un bloqueo transaccional evita instalar dos primeros jefes simultáneamente.
4. Iniciar el servidor y consumir los endpoints siguientes. No se modificó el frontend.

El comando no aplica migraciones. La ejecución de pruebas usa esquemas aislados;
no instala el jefe ni aplica migraciones a la base operativa.

## Contratos HTTP

| Método | Ruta | Entrada / respuesta |
| --- | --- | --- |
| POST | `/api/auth/login` | `{nombre_usuario, password}` → `{usuario, fecha_expiracion}` y cookie |
| GET | `/api/auth/me` | Cookie → `{usuario, permisos, fecha_expiracion}` |
| POST | `/api/auth/logout` | Cookie y `{}` → mensaje y eliminación de cookie; idempotente |
| PATCH | `/api/auth/password` | Cookie y `{password_actual, password_nueva}` → mensaje; revoca todas las sesiones |

Todas las respuestas exitosas usan 200 y las rutas auth usan `Cache-Control: no-store`.
Errores: 400 datos inválidos, 401 credenciales/sesión inválida, 403 protección CSRF,
429 límite de intentos. Los errores no incluyen hashes ni tokens.
Un usuario desconocido, inactivo o con contraseña incorrecta recibe el mismo mensaje
de login: `Usuario o contraseña incorrectos`.

En POST/PATCH enviar `Content-Type: application/json` y `X-CSRF-Protection: 1`.
Se rechazan formularios simples, peticiones sin el encabezado y orígenes ajenos a la
lista. CORS autoriza credenciales únicamente para los orígenes configurados.
Clientes como Postman pueden omitir Origin, pero deben enviar los otros encabezados.
El encabezado CSRF es un requisito de petición no simple, no una credencial secreta.

En navegador utilizar `credentials: "include"` en todas las llamadas auth, por ejemplo:

```js
await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: {
        "Content-Type": "application/json",
        "X-CSRF-Protection": "1"
    },
    body: JSON.stringify({ nombre_usuario, password })
});
```

No guardar tokens en localStorage. Las cookies son HttpOnly y SameSite=Strict;
en producción además Secure y nombre `__Host-capecomsil`, sin Domain y con Path=/.
En desarrollo el nombre es `capecomsil_session`. Frontend y API deben estar en el
mismo sitio para SameSite=Strict: usar localhost en ambos o 127.0.0.1 en ambos,
sin mezclarlos. En producción utilizar HTTPS y un despliegue del mismo sitio.

## Contraseñas y sesiones

- Hash `scrypt`, N=131072, r=8, p=1, sal aleatoria de 16 bytes y clave de 64 bytes.
  El formato incluye parámetros y sal. No se cifra reversiblemente la contraseña.
- Nuevas contraseñas: 15 a 128 caracteres, máximo 512 bytes; no se recortan espacios
  ni se transforma Unicode. El usuario sí se normaliza a minúsculas y sin espacios externos.
- Cookie con token aleatorio de 32 bytes. PostgreSQL guarda solo su SHA-256.
- Vencimiento absoluto desde el login, sin renovación silenciosa. Login con una cookie
  anterior revoca esa sesión y crea un token nuevo. Sesiones en otros dispositivos
  pueden coexistir hasta su vencimiento o cambio de contraseña.
- Cada consulta autenticada comprueba vencimiento, revocación y usuario activo, y
  vuelve a consultar rol/permisos. No se acepta identidad proporcionada por el cliente.
- Cambio de contraseña exige la actual, actualiza el hash y revoca todas las sesiones
  en una transacción. Se debe iniciar sesión nuevamente. El primer jefe no requiere
  cambio inicial porque él elige su contraseña; el flag de otras cuentas se devuelve
  para integrarlo con las restricciones del paso 3.
- Cuentas desactivadas no autentican. La futura operación administrativa de desactivación
  deberá revocar también sus sesiones para que no revivan si se reactiva la cuenta.

## Límites y operación

Se admiten 10 intentos por cuenta y 30 por IP en ventanas de 15 minutos, tanto para
login como para cambio de contraseña (contadores separados por operación). Incluye
intentos exitosos. Los contadores son atómicos, persisten en PostgreSQL y se limpian
al vencer; no se reinician al reiniciar Node. No hay bypass mediante X-Forwarded-For:
Express no confía en proxies por defecto. Detrás de un proxy se contará su IP; antes
de desplegar deberá configurarse la confianza solo para los proxies reales conocidos.

La tabla `autenticacion_intento` contiene hashes de claves de cuenta/IP, no contraseñas.
No constituye una auditoría de seguridad; el historial administrativo corresponde a
otra etapa. La generación de scrypt consume memoria y tiempo deliberadamente; medir
capacidad antes de desplegar. No reducir sus parámetros para acelerar las pruebas.

Referencias del diseño: [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
y [OWASP CSRF: encabezados personalizados para APIs](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#employing-custom-request-headers-for-ajaxapi).
