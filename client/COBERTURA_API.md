# Cobertura del frontend respecto a la API

| Área | Estado y operaciones |
|---|---|
| Sesión y perfil | Login por usuario, cambio de contraseña provisional, límite de intentos, sesión compartida, edición propia y cierre de sesión. |
| Fotos | Perfil, choferes, vehículos y productos de inventario: carga, reemplazo y retirada con selector compartido, vista previa local y actualización al guardar. Requiere migraciones 026 y 027 y R2 configurado. |
| Catálogos | Vehículos, choferes, gasolineras, terminales, productos transportados, proveedores, trayectos, categorías y productos de inventario: CRUD conectado, filtros, orden y paginación. |
| Tarifas | Tarifas por terminal/capacidad conectadas; consulta y cambio de modalidad por gasolinera. El servidor decide si reemplaza un período sin uso o conserva historial. |
| Configuración | Feriados, viáticos, remuneración, combustible y peajes conectados. |
| Viajes | Listado, detalle con entregas/tramos/costos, creación, edición con motivo/versión, anulación e historial. Recorrido automático. |
| Liquidaciones | Selección automática/manual, borrador editable/eliminable, envío, confirmación, anulación solo desde ENVIADA/CONFIRMADA. Versiones en escrituras. |
| Facturas de proveedores | Registro con conceptos y recepción inicial opcional; detalle, pagos, recepciones, pendientes, nueva recepción y anulación. |
| Pagos a proveedores | Registro, consulta y anulación. Reglas de pago y saldo las valida el servidor. |
| Recepciones | Consulta por factura, pendientes, registro con detalles seleccionables y anulación. |
| Mantenimiento | Registro con materiales, consulta, finalización, cumplimientos y anulación; planes con CRUD propio. |
| Gastos y abastecimientos | Registro, consulta y anulación. Viáticos seleccionables por fecha del gasto. |
| Inventario | Existencias, bajo stock, movimientos paginados, ajustes y reversión por código de ajuste. |
| Remuneraciones | Consulta por chofer/período, detalle y generación. Sin cierre de remuneración. |
| Informes | Viajes, resumen económico, viáticos y consumo de combustible por período. |
| Costos de viaje | Consulta del detalle del viaje seleccionado; importes no editables. |
| Dashboard | Viajes válidos del mes y borradores según permisos; no muestra importes ficticios de facturación. |

## Pendientes deliberados

- Facturación y cobros a clientes: sin API del backend; las pantallas lo indican.
- Administración de usuarios, roles y permisos del jefe: excluida del alcance acordado.
- Cierre operativo e importación histórica: siguen pendientes.

## Componentes y verificación

Se retiraron CatalogoPage y TemplateForm. CatalogoConectado comparte el listado,
formularios y modales; ConsultaCatalogo agrega criterios previos para consultas.
Login y dashboard conservan presentaciones específicas. Perfil usa modo ficha.

Los permisos y estados condicionan las acciones visibles y el servidor conserva
la autorización definitiva. Los endpoints paginados se recorren antes de aplicar
filtros locales; esto prioriza integridad del listado sobre ahorro de descarga.

Pruebas: renderizado de todas las rutas/formularios, contratos HTTP, campos anidados,
versiones y validadores reales de compras/liquidaciones, más interacción en navegador
con datos simulados (incluido modal a 390 px). Compilar con `npm run build` y ejecutar
`node --test --test-concurrency=1 test/*.test.js` desde client.

El escenario reproducible `test/interacciones.html` se sirve solo en desarrollo y
no usa el backend real. No se ejecutaron escrituras de aceptación contra datos de
la empresa ni se aplicaron migraciones durante esta reorganización.
