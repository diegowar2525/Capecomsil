# Fotos de perfil en Cloudflare R2

El backend almacena imágenes en un **bucket privado**, independiente de Render o
Railway. PostgreSQL conserva la URL de consulta en `usuario.imagen_url` y la clave
del objeto en `usuario_foto`. Las claves y credenciales no se devuelven al cliente.
Las URLs HTTP/HTTPS anteriores siguen siendo compatibles.

## Activación

1. Crear un bucket R2 privado desde Cloudflare. No habilitar acceso público ni
   `r2.dev`. Crear credenciales S3 con lectura/escritura de objetos limitadas a ese
   bucket. Usar buckets y credenciales separados para desarrollo y producción.
2. Instalar dependencias con `npm ci` en `server` (Node 22 LTS o superior).
3. Para una base existente, aplicar **una sola vez**
   `database/migrations/026_fotos_usuario.sql` y después
   `database/migrations/027_fotos_catalogos.sql`, respetando ese orden. Si la 026
   ya está aplicada, ejecutar solamente la 027.
   Para una instalación nueva, `database/schema.sql` ya incluye estas tablas y el
   trigger: no ejecutar también estas migraciones.
4. Configurar las variables de `server/.env.example` en el entorno del servidor:
   `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`,
   `API_PUBLIC_URL`. No usar variables `VITE_*` para secretos ni subir `.env` a Git.
5. `API_PUBLIC_URL` es el **origen del sistema que sirve `/api`**, sin rutas. En
   desarrollo con proxy de Vite: `http://localhost:5173`. En producción:
   `https://sistema.example.com`, con `/api` reenviado al backend. Mantener frontend
   y API bajo ese mismo origen permite que el navegador envíe la cookie de sesión
   al mostrar las fotos. No cambiar a cookies de terceros para resolverlo.
   Configurar también `AUTH_ORIGINS`, HTTPS y las cookies según la guía de sesión.
6. Programar `npm run limpiar-fotos` cada hora en un job del proveedor, con las
   mismas variables y acceso a PostgreSQL/R2. Cada ejecución procesa hasta 100
   objetos; ajustar la frecuencia al volumen. Si falla, la cola se conserva para
   el siguiente intento. Supervisar el código de salida del job. No ejecutar dos
   entornos sobre el mismo bucket y base de datos de producción.

No requiere discos persistentes en el proveedor. Sin configuración R2 las rutas
de carga/lectura de fotos devuelven 503 y el resto del sistema sigue funcionando.
Cambiar `API_PUBLIC_URL` después de guardar fotos requiere actualizar las URLs
guardadas **y** sus referencias en `usuario_foto` mediante una migración coordinada;
elegir un dominio estable antes de producción.

## API

| Método y ruta | Función |
| --- | --- |
| `PUT /api/auth/me/foto` | Carga/reemplaza únicamente la foto del usuario autenticado |
| `DELETE /api/auth/me/foto` | Quita su foto y devuelve el usuario actualizado |
| `GET /api/auth/fotos/:id` | Devuelve WebP de un usuario activo a usuarios con sesión válida |
| `PUT /api/fotos/:recurso/:id` | Carga/reemplaza la foto de un registro del catálogo |
| `DELETE /api/fotos/:recurso/:id` | Quita la foto del registro |
| `GET /api/fotos/:recurso/:id` | Consulta la foto del registro con sesión y permiso |

Recursos admitidos: `choferes`, `vehiculos` y `productos` (inventario, no los
combustibles transportados). Consultar exige `catalogos.consultar`; cargar o
quitar exige `catalogos.editar`. Quitar la foto no requiere permiso para eliminar
el registro. Los endpoints nuevos conservan los mismos contratos de multipart,
CSRF y validación que el perfil. `catalogo_foto` guarda la clave con una referencia
foránea al registro correspondiente. El mismo job limpia las fotos de los cuatro
módulos, también cuando se elimina un registro o se cambia su URL por la API anterior.

Todos requieren sesión; una contraseña temporal debe cambiarse previamente.
JEFE y OPERADOR pueden administrar su propia foto. PUT/DELETE no reciben un ID de
usuario del cliente. Las fotos no son públicas: la consulta requiere autenticación.
No se ha añadido administración de fotos de terceros.

**PUT:** `multipart/form-data`, exactamente un archivo en el campo `foto`, sin
otros campos. Enviar `X-CSRF-Protection: 1`, cookie de sesión y un origen permitido.
El navegador debe generar el encabezado Content-Type y su boundary. No establecer
`application/json` ni usar el helper JSON sin adaptarlo para FormData.

```js
const data = new FormData();
data.append('foto', archivo);
const response = await fetch('/api/auth/me/foto', {
    method: 'PUT', credentials: 'include',
    headers: { 'X-CSRF-Protection': '1' }, body: data
});
// Comprobar response.ok y propagar el usuario actualizado al contexto de sesión.
```

**DELETE:** enviar `X-CSRF-Protection: 1` y `Content-Type: application/json`;
puede no llevar cuerpo. PUT y DELETE devuelven el objeto de usuario, igual que
`PATCH /api/auth/me`. La URL devuelta incluye una versión para refrescar el avatar.
GET devuelve `Cache-Control: private, no-store` y `X-Content-Type-Options: nosniff`.

Límites: 3 MB de entrada, 20 megapíxeles, JPEG/PNG/WebP sin animación. El contenido
se decodifica realmente; no se confía en extensión ni MIME. Se corrige la orientación,
en perfiles se recorta hasta 512×512; en catálogos se conserva el encuadre completo
con un máximo de 1024 píxeles por lado. No se amplían imágenes pequeñas; se convierte a WebP y se
eliminan metadatos. No se aceptan SVG ni GIF. Archivos inválidos: 400; exceso de
tamaño: 413; sesión inválida: 401; protección CSRF/contraseña temporal: 403;
foto inexistente: 404; almacenamiento no disponible: 503.

## Consistencia y limpieza

Se registra la clave en una cola durable antes de subir. Si falla la carga o el
guardado en la base, la foto anterior permanece y la carga abandonada se puede
limpiar después de una hora. Al confirmar el cambio, la clave nueva sale de la
cola y la foto anterior entra en ella. Borrado físico diferido, sin hacer fallar
un perfil ya guardado por un problema posterior de R2.

El trigger también cubre cambios por el endpoint antiguo de perfil y por la
administración de usuarios: reemplazar una foto gestionada por una URL externa
encola el archivo antiguo. Nunca se descarga ni se borra una URL externa.
La limpieza solo borra claves encoladas sin referencias activas; puede reintentarse.
Tras quitar una foto deja de estar disponible inmediatamente por la API aunque el
objeto privado espere al siguiente job.

El bucket y PostgreSQL deben tener políticas coordinadas de respaldo. El historial
de usuarios guarda el cambio de URL, no una copia permanente de la imagen anterior.
Restaurar una base antigua no restaura por sí solo objetos ya eliminados de R2.

## Alcance y comprobaciones

El frontend permite elegir, reemplazar y quitar fotos desde el perfil y los
formularios de creación/edición de choferes, vehículos y productos de inventario.
La previsualización aparece junto al selector. Seleccionar o cancelar no envía
archivos; el envío ocurre al guardar. Perfil y sidebar reciben el usuario actualizado.

El guardado de datos y el de la foto son dos peticiones: si los datos se guardan y
R2 falla, se informa expresamente del guardado parcial. El modal conserva el ID
creado para reintentar sin duplicar; cerrar el modal no revierte los datos ya
guardados. Los errores de foto no eliminan la anterior. No se envían credenciales
de R2 al navegador.

`node --test test/fotos-usuario.test.js` prueba transformación, HTTP con sesiones
reales, migración, errores y limpieza en un esquema PostgreSQL aislado. R2 se
simula: hace falta una prueba real de carga/consulta/reemplazo/borrado después de
configurar el bucket y aplicar la migración. Las pruebas no aplican migraciones
a la base de negocio ni contactan Cloudflare.

Referencias: [R2 con AWS SDK v3](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/),
[credenciales S3](https://developers.cloudflare.com/r2/get-started/s3/).
