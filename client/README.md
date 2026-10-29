# Capecomsil — Frontend

La estructura y las convenciones del proyecto están documentadas en
[ESTRUCTURA.md](ESTRUCTURA.md). Las pantallas actuales son una base visual;
la integración con sesiones, permisos y APIs está pendiente.

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
Informes usa sus consultas específicas y no muestra un listado vacío con filtros.

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
