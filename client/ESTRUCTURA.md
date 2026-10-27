# Organización del frontend

## Composición y sesión

`App.jsx` compone `AuthProvider`, `PerfilProvider`, `SesionGate` y el panel. El estado
de sesión y permisos pertenece a `modules/auth`; el perfil adapta ese estado y
actualiza los datos personales sin realizar una segunda carga de sesión.

- `app/routes.jsx`: registro único de pantallas, etiquetas y grupos.
- `app/navigation.js`: menú derivado del registro.
- `app/routePermissions.js`: permisos de consulta de cada ruta.
- `app/AppRoutes.jsx`: resolución de rutas y bloqueo de pantallas sin permiso.
- `app/useLocation.js`: navegación mediante hash, con atrás/adelante.
- `layouts/AppLayout.jsx`: sidebar, panel y comportamiento móvil.
- `modules/login`: acceso, cambio obligatorio de contraseña provisional y límite
  de intentos. Separa componentes, hooks, dominio y servicios.

Las credenciales no se almacenan en localStorage. `services/http.js` comparte
cookies, encabezado CSRF, JSON, cancelación y errores. Un 401 fuera del login
invalida la sesión. La visibilidad del menú nunca sustituye los permisos del servidor.

## Componentes compartidos

`CatalogoPage` y `TemplateForm` fueron retirados. Las páginas conectadas usan:

- `Listado`: presentación de tabla, espacio para filtros y paginación; no conoce APIs.
- `CatalogoConectado`: coordinación del listado, acciones, permisos, filtros, mensajes y modales.
- `CatalogoModal`: carga de registro, opciones y datos relacionados; error y reintento.
- `AccionCatalogo`: formulario y ejecución de una acción; resultados de consultas y tablas de detalle.
- `CatalogoForm`: campos controlados, condiciones, múltiples, grupos y filas anidadas.
- `CatalogoDetalle`: ficha de campos de consulta, sin convertir cálculos en campos editables.
- `ConsultaCatalogo`: selección previa de criterios para recepciones por factura,
  remuneraciones por chofer/período y costos por viaje.
- `RowActions`: presenta las acciones que recibe; `domain/acciones.js` comprueba estado y permisos.
- `Modal`: foco, Escape, scroll y adaptación a pantallas pequeñas.

Una definición declara `page`, `columns`, `fields`, `rowKey`, `api`, `prepare`,
`actions`, `filters` y `permissionResource`. `createPermission` permite acciones de
cabecera como generar remuneraciones o ajustar inventario. Las acciones especiales
declaran su permiso explícito. `parent` coloca una acción dentro de detalle/edición;
`global` la presenta en la cabecera; `query` conserva el modal abierto al consultar.
`states`, `requiresOpen` y `requiresFinished` restringen acciones según el registro.

`renderForm` sustituye los campos de un formulario compartido, como en liquidaciones,
gastos y recepciones. `Form` permite un formulario completo, como viajes, evitando
formularios HTML anidados. `mode: 'single'`, `Card` y `canEdit` mantienen la ficha del
perfil con sus extras, sin tabla ni paginación.

## Responsabilidades por módulo

- `*.fields.js`: campos editables explícitos, no derivados de las columnas.
- `*.columns.js`: nombres del esquema o alias reales de las consultas.
- `*.actions.js`: acciones, campos, estados y tablas secundarias.
- `*.filters.js`: filtros locales del listado.
- `services/`: endpoints y adaptación de respuestas, sin estado de React.
- `domain/`: preparación y validación pura, sin HTTP.
- `hooks/`: estado y coordinación de consultas y escrituras.
- `components/`: formularios y presentación específicos.
- `context/`: solo estado compartido entre zonas, como sesión y perfil.

Los CRUD usan `useCatalogo`; las consultas previas reutilizan `ConsultaCatalogo`.
`useRegistroCatalogo` cancela lecturas al desmontar. `useOpcionesDependientes`
cancela consultas obsoletas cuando cambia el período, gasolinera o factura.
`useForm` conserva valores ante errores, bloquea envíos duplicados y expone el
error estructurado en `failure` (`field`, `code`, `status`, `retryAfter`).

Los formularios se montan después de cargar el registro y cambian de identidad
mediante `key`. Los campos ocultos no se envían; los decimales permanecen como texto;
las filas y selecciones múltiples permanecen como arrays. Las escrituras recargan
el listado para recuperar nombres y cálculos normalizados por el servidor.

## Flujos específicos

### Viajes

`ViajeForm`, `ViajeCabecera`, `EntregaForm` y `RecorridoPreview` presentan cabecera,
entregas y recorrido. `useViajeForm` administra el estado; `domain/recorrido.js`
encadena los tramos. El origen es un terminal de carga, cada parada tiene uno o
varios productos, y el destino posterior a la última entrega es opcional. Un
trayecto único se selecciona automáticamente; varias rutas requieren elección.
Una conexión inexistente bloquea el envío. Recargas en varios terminales requerirían
ampliar la interfaz.

`domain/edicion.js` reconstruye el viaje consultado. `ViajeOperacionForm` envía
versión y motivo al editar; conserva IDs de entregas y de tramos que mantienen su
trayecto/orden. El backend calcula tarifas, kilómetros y costos y valida dependencias.

### Liquidaciones

Creación automática por gasolinera/período o selección manual de entregas disponibles.
La edición carga entregas seleccionadas y consulta disponibilidad incluyendo el
borrador actual. Cambiar gasolinera/período limpia la selección previa. Todas las
mutaciones de registros existentes envían su versión. BORRADOR permite editar,
enviar y eliminar; ENVIADA permite confirmar o anular; CONFIRMADA permite anular.
No se anula BORRADOR. Retención y recargo permanecen en cero por decisión de negocio.

### Compras, mantenimiento e inventario

Facturas admiten conceptos PRODUCTO/SERVICIO y recepción inicial opcional. Las
recepciones consultan los detalles pendientes de la factura seleccionada. Pagos a
proveedores conservan las condiciones de cheque y transferencia. Mantenimientos
admiten materiales de inventario/externos, finalización y planes cumplidos. Gastos
carga viáticos por fecha. Inventario consulta existencias, bajo stock y movimientos;
registra ajustes y permite revertirlos indicando el código original consultado en
Movimientos. Los conflictos y dependencias se validan en el servidor.

### Consultas y dashboard

Informes consulta viajes, resumen económico, viáticos y consumo por período.
Remuneraciones exige chofer y período antes de consultar; generar es una acción
separada. El dashboard consulta viajes válidos del mes actual (America/Guayaquil)
y borradores según permisos; no inventa facturación de clientes.

## Orden, filtros y paginación

Se aplica búsqueda/filtros, orden por ID ascendente y luego paginación local de
10/25/50 filas. El ícono alterna el orden. Más filtros agrupa campos adicionales;
las opciones se derivan del listado completo. Limpiar restablece filtros/orden y
conserva el tamaño de página. Los nulos no cumplen rangos; cero sí es válido.

`services/consultas.api.js` omite parámetros vacíos y recorre páginas de 200 cuando
el endpoint pagina (viajes, liquidaciones, gastos, abastecimientos, pagos,
movimientos e informes). Así los filtros locales no se limitan a las primeras
50 filas. Esto descarga el conjunto consultado: para volúmenes grandes conviene
migrar orden/filtros/paginación a la API de forma conjunta.

## Perfil y límites del alcance

Perfil usa `CatalogoConectado` en modo ficha y conserva avatar, nombre, rol, edición
propia y cierre de sesión. La foto es una URL; no hay subida de archivos. Los
catálogos conservan sus extras: kilometraje en detalle de vehículo, modalidades en
gasolinera y cuentas por pagar en proveedor.

Facturación y cobros a clientes muestran expresamente que falta su API. La
administración de usuarios del jefe, cierre operativo e importación histórica
continúan fuera de esta implementación.

## Ejecución y verificación

Desde `client`: `npm run dev`, `npm run build`, `npm run lint` y
`node --test --test-concurrency=1 test/*.test.js`.

Vite reenvía `/api` a `http://127.0.0.1:3000`; `API_PROXY_TARGET` permite cambiarlo.
En producción se requiere un proxy del mismo origen y las migraciones del servidor
aplicadas. Esta reorganización no modifica el esquema ni aplica migraciones.

`test/interacciones.html` es un escenario manual exclusivo de desarrollo: intercepta
todas las peticiones API y usa datos simulados; no inicia sesión real ni modifica
la base de datos. Permite cambiar de pantalla, simular un error de escritura y abrir
una vista de 390 px. No forma parte de la compilación de producción.

Las pruebas de contratos importan validadores reales del backend para compras y
liquidaciones. Las pruebas de navegador verificaron estados, versión, conservación
de formularios tras error, filas anidadas, selectores dependientes, edición de viajes
con IDs y modal móvil sin desbordamiento horizontal. No sustituyen una prueba de
aceptación contra una base de datos real con las migraciones aplicadas.
