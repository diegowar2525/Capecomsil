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

El módulo `viajes` separa responsabilidades así:

- `ViajesPage.jsx`: pantalla y apertura del modal.
- `components/ViajeForm.jsx`: composición del formulario.
- `components/ViajeCabecera.jsx`, `EntregaForm.jsx` y `RecorridoPreview.jsx`:
  presentación y eventos, sin administrar el estado del viaje.
- `hooks/useViajeForm.js`: estado, catálogos para selectores y acciones del formulario.
- `domain/recorrido.js`: funciones puras para construir tramos y preparar el payload,
  independientes de React.
- `viajes.columns.js`: columnas del listado.

`services/viajes.api.js` se creará cuando se conecte la API; no contiene lógica
de recorrido ni se añade un servicio vacío en esta etapa.

Incorporar sesión y permisos antes de conectar operaciones. La visibilidad del
menú no sustituye los permisos del backend. Al integrar APIs, crear
`services/http.js` para cookies, CSRF y errores comunes, y `<modulo>.api.js` en
cada módulo. No se crean servicios vacíos ni un sistema de autenticación ficticio.

Viajes conserva un formulario visual provisional con cabecera, entregas múltiples
y tramos; cargar catálogos y enviar datos está pendiente. Liquidaciones muestra columnas por gasolinera y período.
Facturación y cobros continúan pendientes también en el backend.

`DataTable` admite `rowKey` (nombre de campo o función), `loading` y `error`.
Al conectar datos usar, por ejemplo, `rowKey="id_viaje"`.

Verificar con `npm run build` y `npm run lint` desde `client`.

## Campos alineados con el backend

El formulario de viajes recibe `catalogos` con arrays `terminales`, `gasolineras`,
`vehiculos`, `choferes`, `productos` (productos transportados) y `trayectos`.
No usa datos ficticios ni realiza peticiones. Esta plantilla parte de un solo
terminal de carga; una futura operación con recargas en otros terminales requerirá
ampliar la interfaz.

Las entregas son paradas ordenadas con uno o varios productos. Se pueden mover o
quitar; los tramos se reconstruyen automáticamente. El destino posterior a la
última entrega es opcional. Un trayecto único se selecciona automáticamente;
varias alternativas requieren elección y una conexión inexistente bloquea la
preparación. `domain/recorrido.js` genera `{ detalles, tramos, ...cabecera }` para
el contrato actual de creación. `ViajeForm` admite `onPrepare(payload)` para la
integración futura; el guardado actual sigue deshabilitado. Los controles de
tarifas, peajes, capacidad y permisos siguen correspondiendo al backend.

Pruebas del recorrido: `node --test test/viajes.recorrido.test.js` desde `client`.

Las columnas usan los nombres de `database/schema.sql` o los alias explícitos
de los modelos de consulta (por ejemplo, `nombre_chofer`, `placa`,
`total_galones`, `saldo_pendiente`). Los formularios siguen los validadores de
la API cuando son más restrictivos que el esquema, como el RUC obligatorio.

- Choferes: cédula y tipo de remuneración (`DIARIO_FIJO` / `DIA_TRABAJADO`),
  sin campo de licencia.
- Vehículos: marca y modelo separados, año, capacidad en galones y par de
  valores de inicio del control de kilómetros. No hay compartimentos.
- Gasolineras: dirección, correo, representante legal y agente de retención.
- Proveedores: nombre, RUC, dirección, teléfono, correo y estado.
- Productos de esta pantalla corresponden a `producto_transportado`, no al
  inventario `producto`; no contienen una tarifa base.
- Viajes: inicio y fin con hora, entregas y tramos. Tarifa, importes y kilómetros
  son calculados; no se capturan manualmente. No existe número de guía.
- Facturación y cobros muestran campos del esquema; sus APIs siguen pendientes.

Los booleanos se muestran como Activo/Inactivo o Sí/No. Los campos calculados
no se convierten automáticamente en entradas editables. Los indicadores del
dashboard son un contrato visual provisional y no tienen endpoint de agregación.
