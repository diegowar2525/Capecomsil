# API de CAPECOMSIL

Sistema de gestión administrativa y operativa para una empresa ecuatoriana de transporte de combustible. El desarrollo actual se concentra en la API; el cliente React todavía muestra una pantalla de comprobación de conexión.

## Arquitectura y ejecución

- Backend: Node.js, Express, JavaScript CommonJS y PostgreSQL mediante `pg`, sin ORM.
- Frontend: React y Vite en `../client`.
- Capas: rutas, controladores, servicios, modelos y validadores.
- Convenciones de controladores y respuestas HTTP: [controllers/README.md](src/controllers/README.md).
- Convenciones de modelos, resultados y conexiones: [models/README.md](src/models/README.md).
- Convenciones de servicios, errores y transacciones: [services/README.md](src/services/README.md).
- Convenciones de validación y normalización: [validators/README.md](src/utils/validators/README.md).
- API bajo `/api`; `GET /api/health` comprueba la respuesta HTTP, sin verificar la conexión con PostgreSQL.
- Cálculos monetarios con NUMERIC de PostgreSQL y decimales devueltos como texto.
- Transacciones y bloqueos para operaciones compuestas y controles de concurrencia.

Crear `server/.env` con `PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`. Los puertos predeterminados son 3000 para HTTP y 5432 para PostgreSQL.

Desde `server`:

```sh
npm install
npm run dev
# Ejecución sin nodemon:
npm start
```

Desde `client`, ejecutar `npm install` y `npm run dev` para iniciar Vite. La pantalla actual consulta `http://localhost:3000/api/health`.

## Estado actual

Tarifas por capacidad e historial de modalidades por gasolinera: [guía de API y migración 024](TARIFAS_CAPACIDAD.md). El servidor selecciona la modalidad según la fecha del viaje; las pantallas correspondientes ya tienen plantillas de catálogo y modal.

La tabla describe código presente en el repositorio. No implica que los módulos tengan interfaz ni que todas las pruebas se hayan ejecutado satisfactoriamente.

| Área | Implementación actual |
| --- | --- |
| Catálogos y tarifas | CRUD de vehículos, choferes, terminales, gasolineras, proveedores, categorías, productos, combustibles transportados y tarifas |
| Viajes y recorridos | Catálogo de trayectos; registro, consultas, edición transaccional con versiones e historial, y anulación de viajes con tramos y entregas |
| Costos y remuneraciones | Configuraciones por vigencia, remuneración diaria, viáticos y costos automáticos |
| Compras | Facturas de productos y servicios, recepciones iniciales y posteriores, consultas y anulaciones |
| Inventario | Stock, mínimos, movimientos, ajustes y reversiones |
| Pagos a proveedores | Registro, consultas, anulación y control de saldos |
| Mantenimientos | Registro, consultas, finalización, anulación, materiales internos y externos, planes y cumplimientos |
| Gastos y abastecimientos | Registro, consultas y anulaciones de gastos reales y cargas de combustible |
| Informes | Viajes, resumen económico, viáticos y consumo entre cargas completas |
| Liquidaciones | Consulta, creación y edición de borradores, envío, confirmación, anulación y eliminación de borradores; todo exclusivo del jefe. Ver [LIQUIDACIONES.md](LIQUIDACIONES.md) |
| Facturación y cobros a clientes | Tablas existentes; sin API para facturar y cobrar después de confirmar una liquidación |
| Usuarios y permisos | Login, sesiones, logout, cambio de contraseña y creación local del primer jefe; rutas protegidas por permisos. Administración de cuentas exclusiva del jefe, contraseñas temporales, protección del último jefe e historial. Ver [ADMINISTRACION_USUARIOS.md](ADMINISTRACION_USUARIOS.md) |
| Interfaz y administración | Pendientes las pantallas operativas, dashboard, calendario y exportaciones PDF/Excel |

La migración histórica completa desde Excel sigue pendiente. El seed incluye catálogos extraídos de Excel y escenarios sintéticos de desarrollo; no constituye una migración completa de operaciones reales.

Todas las rutas operativas y sus ejemplos requieren cookie de sesión. En navegador usar
`credentials: "include"`; en POST/PUT/PATCH/DELETE enviar `Content-Type: application/json`
y `X-CSRF-Protection: 1`, incluso al eliminar sin cuerpo. Ver [AUTORIZACION.md](AUTORIZACION.md).
La migración 016 incorpora la revocación de sesiones al desactivar cuentas o cambiar
credenciales; la 017 añade el historial administrativo. No se aplican automáticamente a bases existentes.

## Base de datos

Para una base vacía, ejecutar `database/schema.sql` desde la raíz del proyecto. Define las 45 tablas actuales, restricciones, funciones, triggers y la extensión `btree_gist`, además de los roles y permisos iniciales. Requiere permisos para crear esos objetos.

```sh
psql -1 -v ON_ERROR_STOP=1 -d capecomsildb -f database/schema.sql
```

Para cargar datos de desarrollo después del esquema, usar `database/seed.sql` y consultar [SEED_EXCEL.md](../database/SEED_EXCEL.md) y [SEED_INFORMES.md](../database/SEED_INFORMES.md).

El esquema consolidado no actualiza bases existentes ni está diseñado para ejecutarse repetidamente sobre ellas. Para una instalación nueva no se aplican además las migraciones históricas. En bases existentes, revisar la versión y las precondiciones de cada archivo de `database/migrations` antes de aplicarlo. La presencia de archivos SQL no confirma qué versión está instalada en la base de trabajo.

Los estados administrativos de los catálogos se reciben y almacenan como booleanos, con true por defecto. Los estados de procesos conservan sus valores de texto. `gasolinera.agente_retencion` es booleano, con false por defecto.

## Viajes, trayectos y tarifas

| Método | Ruta | Operación |
| --- | --- | --- |
| POST | `/api/viajes` | Registrar viaje con tramos y entregas |
| GET | `/api/viajes` | Listar con filtros |
| GET | `/api/viajes/:id` | Consultar cabecera, tramos, entregas y costos |
| POST | `/api/viajes/:id/anular` | Anular con motivo y conservar historial |
| PUT | `/api/viajes/:id` | Editar cabecera, entregas y tramos con versión y motivo; recalcular costos |
| GET | `/api/viajes/:id/historial` | Consultar autor y cambios de las ediciones |

Cada viaje identifica vehículo, chofer, `fecha_inicio`, `fecha_fin`, tramos ordenados y entregas. Las fechas llevan hora local sin zona, por ejemplo `2026-10-16T08:00:00`. El fin debe ser posterior y estar dentro del mismo día. No se permiten horarios superpuestos para un vehículo o chofer; una operación puede comenzar exactamente al terminar la anterior.

Cada entrega identifica gasolinera, terminal, combustible y galones. La tarifa se selecciona por la fecha del viaje y se conserva en `detalle_viaje.tarifa_aplicada`. El valor de transporte es galones por tarifa, redondeado a centavos por entrega. La cabecera no tiene una única tarifa. Se rechaza superar la capacidad del vehículo y se permiten cargas inferiores sin advertencia. El combustible transportado no modifica el inventario interno de repuestos.

`/api/trayectos` administra el catálogo usado por los tramos. Cada tramo conserva kilómetros y peaje aplicado. El retorno no se añade automáticamente.

`/api/tarifas` ofrece GET de lista y detalle, POST, PUT y DELETE. Sus vigencias son inclusivas, con fin nulo para una vigencia abierta. No se permiten superposiciones para la misma gasolinera y terminal, independientemente del estado administrativo. El precio admite cero y hasta cuatro decimales. Una tarifa utilizada no permite cambiar precio, gasolinera o terminal ni eliminarse. Sus fechas solo pueden cambiar conservando los días utilizados. Para cambiar un precio se crea una nueva vigencia.

Ver [VIAJES.md](VIAJES.md) y [TRAYECTOS.md](TRAYECTOS.md).

La edición requiere la migración 018 en bases actualizadas hasta la 017. Conserva los
IDs de entregas y tramos enviados y rechaza versiones desactualizadas, viajes anulados
y liquidaciones vigentes. El cierre de días aún está pendiente. El orden de trabajo
está registrado en [PLAN_IMPLEMENTACION.md](PLAN_IMPLEMENTACION.md).

## Remuneraciones y costos automáticos

`chofer.tipo_remuneracion` es obligatorio y admite DIARIO_FIJO o DIA_TRABAJADO. La API recorta espacios y normaliza mayúsculas; no hay modalidad predeterminada.

- DIARIO_FIJO genera base de lunes a sábado incluso sin viajes.
- DIA_TRABAJADO requiere al menos un viaje REGISTRADO para generar base.
- Un domingo sin viajes no genera importe en ninguna modalidad.
- Trabajar en domingo o feriado añade el adicional configurado una sola vez.

Los importes dependen de la configuración vigente. Los feriados deben registrarse antes de generar las remuneraciones correspondientes. La modalidad y configuración aplicadas se conservan en el registro diario.

`/api/configuraciones-remuneracion` y `/api/feriados` ofrecen CRUD. `POST /api/remuneraciones-chofer/generar` genera un período explícito de un chofer; los GET de lista y detalle consultan los días generados. Las remuneraciones no tienen estado ni cierre propio: se retiraron las rutas de cerrar/reabrir y su historial mediante la migración 019. El único cierre previsto es el operativo del día, todavía pendiente.

El registro de viajes requiere configuraciones vigentes de remuneración, combustible, viático y peajes, incluido cero cuando un trayecto no tenga peaje. No se presupone un costo cero si falta una configuración. Las configuraciones de costos se administran en:

- `/api/configuraciones-combustible`.
- `/api/configuraciones-viatico`.
- `/api/configuraciones-peaje-trayecto`.

Los costos COMBUSTIBLE y PEAJE se estiman por recorrido y conservan los valores aplicados. CHOFER y VIATICO se distribuyen entre los viajes válidos del día, conservando el total exacto en centavos. Registrar o anular viajes redistribuye las asignaciones diarias dentro de la transacción. No se deben sumar otra vez los totales diarios y sus asignaciones como si fueran gastos diferentes.

Estas estimaciones no generan pagos, gastos reales ni abastecimientos. Ver [COSTOS_HORARIOS.md](COSTOS_HORARIOS.md) y [REMUNERACIONES.md](REMUNERACIONES.md). El registro de viajes exige `fecha_inicio` y `fecha_fin` con hora.

## Compras, recepciones y pagos a proveedores

`/api/facturas-proveedor` permite registrar y consultar facturas. Los detalles se registran junto con la cabecera, sin CRUD independiente. Se admiten PRODUCTO, SERVICIO o ambos, con cantidad, precio, descuento e impuesto por línea. La API calcula importes e ignora los totales enviados por el cliente.

PostgreSQL redondea el bruto por línea a centavos, resta el descuento y calcula el impuesto sobre ese subtotal neto. La cabecera suma los valores de los detalles; `descuento_total` es informativo y no se resta por segunda vez. El porcentaje de impuesto debe enviarse por línea; no hay una tasa comercial predeterminada.

Una factura puede registrarse sin recibir productos. `recepcion_inicial` es opcional y usa `numero_detalle`, la posición de la línea en la petición comenzando en 1. Factura, detalles y recepción inicial comparten conexión y transacción.

Las recepciones posteriores usan `POST /api/recepciones-compra`:

```json
{
  "id_factura_proveedor": 1,
  "fecha_recepcion": "2026-10-05",
  "numero_comprobante": "ENTREGA-002",
  "detalles": [
    { "id_detalle_factura_proveedor": 1, "cantidad_recibida": "3.00" }
  ]
}
```

Se usan los IDs reales de los detalles de factura. No se reciben servicios ni más unidades que las pendientes. Solo las cantidades recibidas generan entradas de stock. Una factura PAGADA puede recibir productos; una ANULADA no. Los bloqueos protegen contra excesos en recepciones concurrentes.

| Ruta | Operación |
| --- | --- |
| `GET /api/facturas-proveedor/:id/recepciones` | Recepciones de la factura |
| `GET /api/facturas-proveedor/:id/pendientes-recepcion` | Cantidades pendientes |
| `POST /api/recepciones-compra/:id/anular` | Anular con las validaciones y reversiones del servicio |
| `GET /api/facturas-proveedor/:id/pagos` | Pagos de la factura |
| `POST /api/facturas-proveedor/:id/anular` | Anular sin pagos ni recepciones vigentes |

`/api/pagos-proveedor` permite registrar pagos y consultar lista o detalle; `POST /api/pagos-proveedor/:id/anular` conserva el historial del pago anulado. El servicio controla los saldos y rechaza pagos superiores a lo pendiente. No hay edición general ni eliminación de facturas de proveedor. Cambiar un estado directamente en SQL no sustituye las operaciones de anulación.

Ver [PAGOS_PROVEEDOR.md](PAGOS_PROVEEDOR.md).

## Productos e inventario

`/api/productos` ofrece GET de lista y detalle, POST, PUT y DELETE. Nombre, categoría y unidad son obligatorios. Los GET incluyen el nombre de categoría. La unidad se normaliza a minúsculas; el stock mínimo no puede ser negativo. La categoría debe existir y estar activa al crear o cambiar la categoría del producto. El CRUD de productos no cambia las existencias.

Compras, movimientos o mantenimientos asociados impiden eliminar el producto o cambiar su unidad. Las categorías pueden marcarse con `es_llanta`; para ellas, el producto exige `condicion_llanta` NUEVA o REENCAUCHADA. Para otras categorías debe ser nula. Con historial, medida y condición quedan protegidas. Vehículos, choferes y productos admiten `imagen_url`.

El stock se obtiene sumando ENTRADA y AJUSTE y restando SALIDA. Entradas y salidas usan cantidades positivas; un ajuste expresa una diferencia positiva o negativa, nunca cero ni el saldo final deseado. El servicio bloquea el producto y verifica el saldo dentro de la transacción para impedir ajustes que dejen stock negativo.

| Método | Ruta | Operación |
| --- | --- | --- |
| GET | `/api/inventario/stock` | Stock de productos |
| GET | `/api/inventario/stock/:id` | Stock de un producto |
| GET | `/api/inventario/bajo-stock` | Productos con stock inferior al mínimo |
| GET | `/api/inventario/movimientos` | Historial con filtros |
| POST | `/api/inventario/ajustes` | Registrar diferencia con motivo |
| POST | `/api/inventario/ajustes/:id/revertir` | Revertir un ajuste con trazabilidad |

Ver [INVENTARIO.md](INVENTARIO.md) y [RECORRIDOS_Y_MATERIALES.md](RECORRIDOS_Y_MATERIALES.md).

## Mantenimientos y seguimiento

`/api/mantenimientos` permite registrar y consultar lista o detalle. También existen `POST /api/mantenimientos/:id/finalizar`, `/:id/anular` y `/:id/cumplimientos`. No hay edición general ni eliminación de mantenimientos.

Ejemplo con IDs ilustrativos que deben existir en la base:

```json
{
  "id_vehiculo": 1,
  "id_proveedor": null,
  "fecha_inicio": "2026-10-05T08:00:00",
  "fecha_fin": "2026-10-05T10:00:00",
  "tipo": "Cambio de filtros",
  "monto": "25.00",
  "detalles": [
    { "origen_producto": "INVENTARIO", "id_producto": 1, "cantidad": "2.00" },
    { "origen_producto": "EXTERNO", "descripcion_producto": "Material aportado por el taller", "cantidad": "1.00" }
  ]
}
```

Vehículo, inicio con hora, tipo y monto son obligatorios; el proveedor es opcional. El monto admite cero y representa el importe registrado para el mantenimiento: no se calcula desde materiales ni genera automáticamente gastos, facturas o pagos. Los detalles son opcionales. INVENTARIO es el origen predeterminado, comprueba stock y genera salidas; EXTERNO exige descripción y no acepta `id_producto`. Al anular solo se revierten las salidas que realmente se generaron.

Un mantenimiento puede durar varios días. Con `fecha_fin: null`, el vehículo queda ocupado hasta finalizarlo o anularlo. No se permiten cruces con viajes ni otros mantenimientos válidos del mismo vehículo. Cabecera, detalles y movimientos se registran en la misma transacción; el stock insuficiente devuelve 409.

`GET /api/vehiculos/:id/kilometraje` calcula el kilometraje estimado a partir del control base y los tramos históricos de viajes válidos finalizados. Sin control configurado devuelve SIN_CONFIGURAR. `/api/planes-mantenimiento` ofrece CRUD de planes por vehículo y seguimiento con situaciones AL_DIA, PROXIMO, VENCIDO e INACTIVO. Los cumplimientos se vinculan a mantenimientos con las validaciones del servicio.

Ver [SEGUIMIENTO_MANTENIMIENTO.md](SEGUIMIENTO_MANTENIMIENTO.md) y [COSTOS_HORARIOS.md](COSTOS_HORARIOS.md).

## Gastos, abastecimientos e informes

`/api/gastos` y `/api/abastecimientos-combustible` permiten registrar y consultar lista o detalle, además de anular con `POST /:id/anular`. Se admiten gastos sin vehículo. Los abastecimientos registran las cargas reales; se distinguen de las estimaciones automáticas de combustible de los viajes.

Informes disponibles por GET:

- `/api/informes/viajes`.
- `/api/informes/resumen-economico`.
- `/api/informes/viaticos`.
- `/api/informes/consumo-combustible`.

Los informes comparan estimaciones y valores reales y analizan consumo entre cargas completas según los filtros de cada consulta. No equivalen a exportaciones PDF/Excel ni a un dashboard terminado. Ver [INFORMES.md](INFORMES.md) y [GASTOS_ABASTECIMIENTOS.md](GASTOS_ABASTECIMIENTOS.md).

## Liquidaciones, facturación y cobros

El esquema actual contempla liquidaciones por gasolinera y período, con estados BORRADOR, ENVIADA, CONFIRMADA y ANULADA, fechas e importes. `detalle_liquidacion` relaciona liquidaciones con entregas de viajes y conserva galones, tarifa e importe históricos. Sustituye la antigua columna física `detalle_viaje.id_liquidacion`. Las consultas de entregas conservan `id_liquidacion` como campo calculado para la liquidación vigente.

La migración `013_liquidaciones_detalles.sql` corresponde a esta transición y requiere revisar sus precondiciones sobre los datos existentes. La API permite consultar entregas disponibles, listar liquidaciones, crear o editar borradores, enviar, confirmar, anular con motivo y eliminar borradores, exclusivamente al jefe. Conserva valores históricos, reserva las entregas y controla operaciones simultáneas mediante una versión. Retención y recargo permanecen en cero. Anular conserva detalles y libera entregas; una factura asociada impide la anulación. Enviar solo registra el estado, sin envío de correos. Reemplazos y auditoría de cambios quedan pospuestos. Ver [LIQUIDACIONES.md](LIQUIDACIONES.md).

La migración `020_liquidaciones_borradores.sql` agrega la versión y los permisos de este módulo; está preparada en el repositorio y debe aplicarse en orden a las bases existentes. El servidor no ejecuta migraciones automáticamente. Una base nueva usa el esquema consolidado.

La migración `021_liquidaciones_acciones.sql` agrega los permisos de envío,
confirmación, anulación y eliminación, y actualiza las protecciones de estados.
También debe aplicarse en orden; las pruebas en esquemas temporales no la aplican
a la base de trabajo.

El flujo previsto continúa con la factura después de confirmar una liquidación y con los cobros parciales o completos del cliente. Las tablas `factura` y `pago` existen; una clave UNIQUE establece la relación uno a uno entre factura y liquidación. La API para emitir esas facturas, registrar cobros y controlar saldos está pendiente. Las compras y los pagos a proveedores ya tienen su propia API.

Los plazos aproximados del contexto inicial no se consideran reglas definitivas. No se contempla inicialmente emisión electrónica ni integración con el SRI.

## Pruebas y documentación histórica

Desde `server`, `npm test` ejecuta `node --test test/*.test.js`. La suite incluye validadores, rutas HTTP, cálculos, restricciones PostgreSQL, rollback y concurrencia. Las integraciones requieren la conexión de `.env` y permisos para crear objetos; utilizan esquemas temporales con limpieza o rollback según la prueba.

Desde `client`, `npm run build` compila la interfaz y `npm run lint` ejecuta Oxlint. La existencia de pruebas no garantiza que hayan pasado en un entorno sin verificar.

[PROJECT_CONTEXT.txt](PROJECT_CONTEXT.txt) conserva el alcance inicial y reglas que han cambiado. El esquema consolidado, el código y los documentos por módulo deben contrastarse al desarrollar. Ejemplos antiguos que usan `fecha` para viajes o mantenimientos deben usar `fecha_inicio` y `fecha_fin` según los validadores actuales.

## Tipos de gasto y etiquetas de consultas

El catálogo autenticado /api/tipos-gasto permite consultar, crear, editar y
eliminar tipos con los permisos existentes de catálogos. Los códigos son
permanentes; los tipos utilizados se desactivan en lugar de eliminarse.
VIATICO y COMBUSTIBLE son reservados y conservan sus reglas de negocio.
Los listados operativos incluyen las placas y nombres relacionados necesarios
para los filtros y tablas del frontend.

Aplicar database/migrations/025_tipos_gasto.sql en bases existentes antes de
utilizar esta versión. El esquema nuevo ya lo incluye. Véase
[notas de la migración](../database/migrations/025_tipos_gasto.md).
