# Cobertura visual de la API

Los módulos operativos siguen siendo plantillas. Mi perfil es la excepción:
consulta y actualiza los datos del usuario mediante la sesión existente. Guardar, confirmar y consultar el servidor están
deshabilitados. Las pantallas reutilizan tablas, campos y modales del diseño existente.

Todas las rutas citadas parten de `/api`. La API sigue siendo la autoridad para
validaciones, permisos, cálculos, dependencias y transiciones.

| API | Plantilla / acciones |
| --- | --- |
| `/vehiculos` | Catálogo: crear, consultar, editar y eliminar; kilometraje por `/:id/kilometraje` |
| `/choferes`, `/terminales`, `/gasolineras`, `/proveedores` | CRUD mediante listado y modales; proveedores incluye `/:id/cuentas-por-pagar` |
| `/productos-transportados` | Catálogo existente renombrado Productos transportados |
| `/productos`, `/categorias-producto`, `/trayectos`, `/tarifas` | Catálogos nuevos con CRUD visual |
| `/configuraciones-viatico`, `/configuraciones-remuneracion`, `/configuraciones-combustible`, `/configuraciones-peaje-trayecto`, `/feriados` | CRUD visual de configuraciones y vigencias |
| `/viajes` | Crear, consultar, editar y anular; historial por `/:id/historial`; detalle incluye entregas, tramos y costos |
| `/gastos`, `/abastecimientos-combustible` | Listado y filtros, creación, detalle y anulación. Sin editar ni eliminar |
| `/planes-mantenimiento` | CRUD y filtros de situación |
| `/mantenimientos` | Registro, detalle, `/:id/finalizar`, `/:id/cumplimientos`, `/:id/anular`; materiales dinámicos |
| `/facturas-proveedor` | Registro con conceptos y recepción inicial opcional, detalle, anulación; consulta de `/:id/pagos`, `/:id/recepciones`, `/:id/pendientes-recepcion` |
| `/pagos-proveedor` | Registro parcial/completo, detalle, filtros y anulación |
| `/recepciones-compra` | Registrar detalles recibidos y anular. Su listado se consulta por factura, no por GET global |
| `/inventario` | `/stock`, `/stock/:id`, `/bajo-stock`, `/movimientos`, `/ajustes`, `/ajustes/:id/revertir` |
| `/remuneraciones-chofer` | Listado por período y chofer, detalle y `/generar` |
| `/liquidaciones` | Listado, detalle, crear/editar borrador, entregas disponibles, enviar, confirmar, anular y eliminar borrador |
| `/informes` | Viajes, resumen económico, viáticos y consumo de combustible con filtros por período |

## Reglas de presentación

- Facturas y recepciones utilizan REGISTRADA/ANULADA; gastos, pagos y mantenimientos REGISTRADO/ANULADO.
- Liquidaciones: editar/eliminar/enviar en BORRADOR; confirmar en ENVIADA; anular únicamente en ENVIADA o CONFIRMADA. Retención y recargo en cero.
- Costos de viaje son calculados; se consultan con GET del viaje y no tienen un CRUD independiente.
- Los informes muestran estimaciones y gastos registrados por separado.
- Las vistas previas de modales permiten revisar todas las acciones con las tablas vacías. No representan operaciones autorizadas sobre registros reales.
- Al integrar, obtener los detalles completos antes de editar; conservar versión de viaje/liquidación internamente, sin pedirla al usuario.
- Los campos auxiliares de presentación (tipo de extremo, selección automática, activar recepción inicial) se transformarán al contrato en el adaptador; no se enviarán directamente.

## Fuera del alcance

La administración de usuarios, roles, permisos y la pantalla de inicio de sesión siguen pendientes. Mi perfil ya utiliza GET/PATCH /api/auth/me.
`/health` no requiere pantalla de negocio. Facturación y cobros a clientes mantienen
su plantilla anterior: aún no existe su API. Cierre operativo e importación histórica
siguen pendientes. No se modificaron backend, esquema ni datos.

## Comprobación

Compilación, lint y pruebas de renderizado SSR, estados y recorrido. La revisión
visual interactiva quedó pendiente: el navegador de herramientas no pudo acceder
al servidor local (ERR_CONNECTION_TIMED_OUT). El CSS contempla formularios de una
columna en móvil, tablas con desplazamiento y modales con scroll y altura limitada.

La migración `022_liquidaciones_no_anular_borrador.sql` actualiza el trigger para rechazar también la anulación directa por SQL de un borrador.
