# Organización del frontend

La aplicación conserva el diseño inicial y aún no está conectada a las APIs.
Los formularios de ejemplo no guardan datos. Las pantallas operativas tienen
su propio componente; sus formularios se implementarán con los contratos del backend.

- `App.jsx`: compone layout, navegación y pantalla activa.
- `app/routes.jsx`: registro de rutas con componente, etiqueta y grupo del menú.
- `app/navigation.js`: deriva el menú del registro, sin repetir destinos.
- `app/useLocation.js`: escucha la URL hash mediante la API del navegador.
- `app/AppRoutes.jsx`: resuelve pantallas y muestra página no encontrada.
- `layouts/AppLayout.jsx`: estructura visual compartida.
- `modules/<modulo>/`: página, columnas y configuración propias del módulo.
- `components/`: elementos reutilizables. `CatalogoPage` se usa únicamente en
  catálogos sencillos; sus campos se declaran aparte de las columnas.
- `styles/`: conserva variables, estilos base, componentes y vistas.

## Agregar una pantalla

1. Crear su componente en `modules/<modulo>/`.
2. Declarar las columnas fuera del componente cuando sean constantes.
3. Declarar campos editables explícitamente; no derivarlos de las columnas.
4. Registrar componente, ruta, etiqueta y sección en `app/routes.jsx`.
   El menú se actualiza automáticamente. Omitir sección para rutas sin menú.

Las rutas actuales usan `#/viajes`, `#/liquidaciones`, etc. Recargar conserva
la pantalla y atrás/adelante recorre el historial. No se necesita configuración
de reescritura del servidor. Solo están implementadas rutas de listado.

## Próxima integración

Incorporar sesión y permisos antes de conectar operaciones. La visibilidad del
menú no sustituye los permisos del backend. Al integrar APIs, crear
`services/http.js` para cookies, CSRF y errores comunes, y `<modulo>.api.js` en
cada módulo. No se crean servicios vacíos ni un sistema de autenticación ficticio.

Viajes conserva un formulario visual provisional: la captura de entregas múltiples
y tramos está pendiente. Liquidaciones ya muestra columnas por gasolinera y período.
Facturación y cobros continúan pendientes también en el backend.

`DataTable` admite `rowKey` (nombre de campo o función), `loading` y `error`.
Al conectar datos usar, por ejemplo, `rowKey="id_viaje"`.

Verificar con `npm run build` y `npm run lint` desde `client`.
