# Organización del frontend

La aplicación conserva el diseño inicial. Mi perfil y toda la sección Catálogos
se conectan a la API de la sesión actual. Configuración y las demás pantallas
operativas conservan sus plantillas. Ver COBERTURA_API.md.

- `App.jsx`: compone layout, navegación y pantalla activa.
- `app/routes.jsx`: registro de rutas con componente, etiqueta y grupo del menú.
- `app/navigation.js`: deriva el menú del registro, sin repetir destinos.
- `app/useLocation.js`: escucha la URL hash mediante la API del navegador.
- `app/AppRoutes.jsx`: resuelve pantallas y muestra página no encontrada.
- `layouts/AppLayout.jsx`: estructura visual compartida.
- `modules/<modulo>/`: página, columnas y configuración propias del módulo.
- `components/`: elementos reutilizables. `CatalogoPage` comparte listado, búsqueda local, acciones y modales entre
  catálogos y operaciones. Los campos, filtros y acciones se declaran aparte de las columnas.
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

La visibilidad del menú no sustituye los permisos del backend. Al conectar las
operaciones restantes, reutilizar `services/http.js` para cookies, CSRF y errores
comunes, y declarar sus endpoints en `<modulo>.api.js` dentro de cada módulo.

Viajes conserva un formulario visual provisional con cabecera, entregas múltiples
y tramos; cargar catálogos y enviar datos está pendiente. Liquidaciones incluye borradores, selección de entregas y modales de transición de estado.
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

## Plantillas y acciones de los módulos

- `<modulo>.fields.js`: campos editables; `<modulo>.columns.js`: datos de consulta.
- `<modulo>.actions.js`: acciones, estados permitidos, campos y tablas de los modales.
- `<modulo>.filters.js`: filtros del contrato de consulta; no ejecutan peticiones todavía.
- `CatalogoPage/TemplateForm.jsx`: campos condicionales, selección múltiple, grupos y filas dinámicas.
- `CatalogoPage/catalogo.actions.js`: acciones comunes de los catálogos.
- `Modal`: cierre con Escape, manejo de foco, bloqueo de scroll y disposición adaptable.

`CatalogoPage` admite `data` y `catalogos`. Los catálogos genéricos son un mapa por
`source` con opciones `{ value, label }`; el formulario especializado de viajes
conserva sus arrays de entidades. Los selectores permanecen vacíos sin datos.
Las acciones por fila respetan estados declarados; con listas vacías hay una
sección explícita de vista previa para examinar los modales sin inventar registros.
Los filtros remotos y el guardado permanecen deshabilitados; el buscador solo
filtra los datos recibidos por props.

La edición de viajes reconstruye la vista con `domain/edicion.js`. La integración
futura debe conservar IDs de entregas/tramos y enviar versión y motivo en PUT;
el preparador de creación no es todavía un adaptador de edición.

La administración de usuarios, roles, permisos y el formulario de inicio de sesión siguen fuera del alcance; el perfil propio ya está conectado.
Verificación: `node --test test/plantillas.test.js test/viajes.recorrido.test.js`.

## Perfil del usuario autenticado

- `modules/perfil/context/PerfilProvider.jsx`: consulta compartida de sesión y actualización del perfil; no guarda credenciales en localStorage.
- `hooks/usePerfil.js`: acceso al perfil compartido por sidebar y página.
- `services/perfil.api.js`: GET/PATCH `/api/auth/me`, cookies y encabezado CSRF.
- `domain/perfil.js`: preparación de los tres campos editables; vacíos opcionales se envían como null.
- `components/SidebarPerfil.jsx` y `Avatar.jsx`: foto, nombre y rol con iniciales si falta/falla la foto.
- `PerfilPage.jsx` configura CatalogoConectado en modo single; `components/PerfilFicha.jsx` conserva la presentación del perfil y CatalogoModal realiza la edición.

La ruta `#/perfil` no crea otra categoría: se abre desde el avatar del sidebar.
No se muestra identidad ficticia cuando no hay sesión. Todavía no hay formulario
de login, administración del jefe ni subida de archivos. La foto usa una URL.

Requisitos: backend funcionando, sesión válida y migración 023 aplicada a la base.
En desarrollo, Vite reenvía `/api` a `http://127.0.0.1:3000`; se puede cambiar con
la variable de entorno `API_PROXY_TARGET` al arrancar Vite. En producción, servir
`/api` mediante el backend/proxy del mismo origen. Mantener los orígenes permitidos
por el backend y la configuración de cookies. Esta tarea no aplica migraciones.

Pruebas: `node --test test/perfil.test.js test/plantillas.test.js test/viajes.recorrido.test.js`.

## Convenciones para módulos conectados

Los nueve catálogos conectados, incluido vehículos, reutilizan
`components/CatalogoConectado/`: página, modal, formulario controlado y detalle.
Cada módulo conserva `services/`, `domain/` y `hooks/`, además de sus campos,
columnas y configuración. Los hooks del módulo usan `useCatalogo` para el CRUD;
`useRegistroCatalogo` carga el registro completo, selectores y consultas
relacionadas antes de abrir una acción. Ambos cancelan las lecturas al desmontar.

Los servicios usan `crearCatalogoApi` y añaden solo endpoints particulares:
opciones de trayectos/categorías, cuentas por pagar e historial/cambio de modalidad.
Las escrituras recargan el listado para recuperar nombres de referencias y valores
normalizados. Los errores conservan el formulario; las confirmaciones de eliminación
identifican el registro. Las operaciones siguen sujetas a permisos del servidor.

Trayectos deriva los tipos de extremos para editar y descarta IDs de opciones
ocultas al enviar. Productos de inventario exige condición para categorías de
llantas y la limpia al seleccionar otra categoría. No se limita el CRUD a datos
activos: los registros inactivos existentes permanecen consultables/editables.

Perfil y vehículos usan `src/services/http.js` para transporte HTTP (cookies, CSRF,
JSON, errores y cancelación) y `src/hooks/useForm.js` para valores controlados,
preparación, envío, errores y bloqueo de envíos duplicados.

- `services/`: endpoints y adaptación de respuestas; sin estado de React.
- `domain/`: preparación y validación pura de objetos de valores; sin peticiones.
- `hooks/`: consultas y coordinación de operaciones; mantienen los datos actualizados.
- `components/`: presentación con Modal y FormField compartidos; reciben operaciones por props.
- `context/`: solo cuando el estado se comparte entre distintas zonas, como el perfil del sidebar.
- La página coordina navegación, búsqueda y mensajes de éxito.

Montar el formulario cuando termine la carga del registro y cambiar su key al
cambiar de identidad. Los valores iniciales se leen al montar para no sobrescribir
la edición del usuario. TemplateForm sigue disponible para módulos sin conectar;
los formularios de perfil y vehículos usan campos controlados con useForm.

## Orden y filtros de catálogos conectados

Los nueve catálogos muestran ID ascendente por defecto y permiten elegir
descendente. El orden se aplica en el frontend sin modificar el listado original
ni depender del ORDER BY de cada endpoint.

- `domain/catalogoFiltros.js`: orden numérico, combinación de filtros y opciones únicas.
- `hooks/useCatalogoFiltros.js`: búsqueda, selección, orden y limpieza.
- `components/CatalogoConectado/CatalogoFiltros.jsx`: controles etiquetados, contador y distribución adaptable.
- `<modulo>.filters.js`: campos específicos; todos reutilizan `filtroEstado`.

Vehículos filtra marca, capacidad y año; choferes, remuneración; gasolineras,
agente de retención; terminales, ubicación; productos transportados, unidad;
proveedores, RUC/dirección; trayectos, origen/destino; categorías, llantas;
productos de inventario, categoría/marca/condición. Los filtros se combinan y
la búsqueda ignora mayúsculas y acentos. Las opciones se obtienen del listado
completo para que un filtro no oculte las opciones de los demás.

Son filtros locales sobre el listado completo devuelto por los endpoints actuales.
Si se incorpora paginación del servidor, trasladar filtrado y orden a la API antes
de paginar. Actualizar conserva la selección; Limpiar filtros también restablece
el orden ascendente. Si una escritura deja el registro fuera del filtro actual,
no se muestra en la tabla hasta cambiar o limpiar ese filtro.

## Ficha individual y acciones de consulta

CatalogoConectado admite mode: single para perfil: muestra la ficha personalizada
Card, carga, error, reintento y edición. No muestra tabla, filtros ni controles de
orden. canEdit conserva el bloqueo por contraseña temporal. El guardado se delega
al PerfilProvider, que actualiza la identidad compartida con el sidebar; no se
recarga el contexto después de guardar.

Las acciones query de CatalogoModal muestran campos de consulta y resultados en
el mismo modal. Se usan para kilometraje con fecha opcional y no disparan el flujo
de guardado ni cierre. Las acciones especiales de proveedores y gasolineras
siguen disponibles. Los listados comparten paginación y un ícono accesible para alternar el orden; perfil conserva su ficha sin estos controles.

## Paginación y filtros avanzados

CatalogoConectado aplica búsqueda y filtros al listado completo, después ordena
por ID y finalmente divide el resultado en páginas de 10, 25 o 50 registros.
El orden inicial sigue siendo ascendente. Cambiar filtros, orden o tamaño vuelve
a la primera página; una reducción del listado limita la página a la última válida.
La paginación es local: no reduce los registros descargados desde la API.

CatalogoFiltros mantiene búsqueda y estado visibles. Un botón con SVG, etiqueta
accesible y tooltip alterna el orden. Los demás campos están en Más filtros, con
contador de filtros activos aunque la sección esté cerrada. CatalogoPaginacion
muestra el rango, página, tamaño y navegación. Los controles se redistribuyen en
móvil y los botones de navegación tienen un área mínima de 44 px.

Cada módulo declara textos, selecciones, rangos inclusivos (min/max) y presencia
de foto donde aplique. Los valores nulos no cumplen rangos numéricos; cero sí es
válido. Un rango invertido devuelve cero coincidencias, sin corregir la entrada
silenciosamente. Limpiar filtros conserva el tamaño elegido y vuelve al orden
ascendente y a la primera página. Las opciones siguen derivándose de todos los
registros cargados, no solo de la página visible.
