# Capecomsil — Frontend

La estructura y las convenciones del proyecto están documentadas en
[ESTRUCTURA.md](ESTRUCTURA.md). Las pantallas se integran con sesiones,
permisos y las APIs del servidor.

## Plantilla original

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Filtros de los listados

Los listados conectados comparten búsqueda, orden y paginación. Los filtros
adicionales se despliegan en «Más filtros», usando la cuadrícula responsiva
existente. Los selectores conservan el ID como valor y muestran nombres, placas
o números de factura mediante labelKey; las fechas incluyen el día completo.
Viajes, viáticos y consumo de combustible tienen páginas independientes bajo «Consultas e informes», con filtros de período, listado paginado e impresión completa de los resultados.

## Resumen e impresión

«Resumen», debajo del perfil, reemplaza al dashboard. Tiene dos vistas: resumen mensual (ingresos por viajes, costos y movimientos) y cuentas por cobrar acumuladas con detalle por gasolinera. Las rutas antiguas `/dashboard` e `/informes` abren Resumen por compatibilidad.

El módulo `modules/resumen` separa servicios HTTP, hook de carga, formatos, componentes y estilos. Reglas y endpoints: [INFORMES.md](../server/INFORMES.md). No requiere migraciones adicionales a la 034.

`components/InformeImpresion` comparte el membrete, tablas y estilos A4 entre el resumen y las consultas. Usa copias de los logos proporcionados en `assets/brand`, sin depender de rutas locales. «Imprimir / PDF» abre la impresión del navegador; elegir «Guardar como PDF». Se incluyen todos los registros cargados del período, no solo la página visible ni los filtros locales del listado. Se conservan encabezados de tabla y números de página en navegadores compatibles.

Prueba: `node test/resumen.browser.cjs` con Playwright y Edge. Usa datos ficticios y deja PDFs de comprobación en la carpeta temporal del sistema. Incluye escritorio, móvil, recuperación de errores y cartera de varias páginas.

Tipos de gasto tiene CRUD propio. Gastos consulta sus tipos activos y permite
elegir la fecha del viático cuando se registra un desembolso posterior al viaje.
Esta versión requiere la migración database/migrations/025_tipos_gasto.sql
en bases existentes.

## Piezas visuales reutilizables

- SwitchField: interruptor controlado, etiqueta y descripción; genera IDs únicos.
- FormNotice: avisos informativos y errores accesibles.
- FormItemCard: tarjeta de una fila repetible con título y acciones. Su clase
  form-item-card también se usa en las filas del formulario genérico.
- button.css contiene btn-icon, btn-icon-danger, btn-add, btn-add-block y
  btn-remove para acciones de formularios.

Los estilos compartidos viven en styles/components. styles/modules/viajes.css
solo importa viajes/formulario.css, viajes/entregas.css y viajes/recorrido.css;
cada archivo conserva sus ajustes de móvil. DestinoFinalForm encapsula la
presentación del destino opcional; el estado sigue en useViajeForm.

## Fotos de perfil y catálogos

`CatalogoConectado` admite la propiedad `foto` con las operaciones `guardar` y
`eliminar` del servicio compartido `services/fotos.api.js`. `AccionCatalogo`
integra `FotoSelector` sin sustituir el modal ni los campos específicos de cada
catálogo. Los estilos están en `styles/components/foto-selector.css`.

El archivo se previsualiza localmente y se libera su URL temporal al reemplazarlo
o cerrar el modal. Se sube al guardar; cancelar o deshacer la selección no escribe
en el servidor. `guardar-con-foto.js` separa el guardado del registro y el archivo,
informa los fallos parciales y conserva el ID creado para evitar duplicados en un
reintento. Los cuatro módulos usan este mismo flujo. Las fotos también se muestran
en el detalle; el perfil actualiza su ficha y el avatar del sidebar.

La configuración de R2 y las migraciones **026 y 027** se explican en
[FOTOS_PERFIL.md](../server/FOTOS_PERFIL.md). Si la 026 ya está aplicada, ejecutar
solo la 027. Productos se refiere aquí al catálogo de inventario.

Pruebas unitarias: `node --test --test-concurrency=1 test/*.test.js`.
Prueba de navegador: `node test/fotos.browser.cjs`, con Playwright disponible y
Edge instalado. `PLAYWRIGHT_MODULE` puede indicar una instalación externa de
Playwright. El script inicia y cierra su propio servidor Vite, intercepta todas
las peticiones API y verifica los cuatro módulos, cancelación, retirada,
reintentos y un viewport de 390 px. No usa la sesión ni los datos reales.
