# Gastos operativos, viáticos y pagos del taller

**Evolución posterior:** la [migración 030](030_edicion_mantenimiento.md) añade pago inmediato sin factura, creación conjunta de factura y edición con historial. Las reglas de pago directo de este documento describen la versión 029 y los registros históricos.

En una base existente con las migraciones anteriores aplicadas, ejecutar una sola vez `029_origen_gastos_mantenimientos.sql` antes de iniciar esta versión del servidor. Para instalaciones nuevas, `schema.sql` ya incluye los cambios. No ejecutar ambos sobre la misma base. Esta entrega no aplica la migración a la base de trabajo.

La migración conserva los gastos y sus importes. Sustituye `gasto.tipo_gasto` por `origen` e `id_tipo_gasto`; elimina del catálogo Viático y Combustible y retira `codigo` y `reservado`. Los gastos existentes de esas clases mantienen su origen y sus referencias. El vínculo interno `concepto_estimado` conserva la comparación histórica de peajes sin depender del nombre editable. No representa un código que el usuario deba introducir.

## API de gastos

- `POST /api/tipos-gasto`: `nombre`, `descripcion` opcional y `estado`. Todos los tipos del catálogo pueden desactivarse; los usados no pueden eliminarse por la relación histórica.
- `POST /api/gastos`: `origen: "OPERATIVO"` (predeterminado), `id_tipo_gasto`, `fecha`, `monto` positivo y las referencias opcionales existentes.
- Para viáticos: `origen: "VIATICO"`, `id_viatico_chofer`, `fecha` del desembolso y `monto` real. Sin `id_tipo_gasto` ni `id_viaje`. El formulario consulta el día trabajado y muestra el chofer, estimado y desembolsos anteriores. No convierte automáticamente el estimado en gasto.
- `GET /api/gastos`: filtros `origen` e `id_tipo_gasto`, además de los filtros anteriores de fecha, estado y referencias. El antiguo parámetro `tipo_gasto` ya no se admite.
- Combustible se registra desde Abastecimientos. Los pagos del taller se reflejan automáticamente en Gastos operativos, sin volver a registrarlos manualmente.

## Mantenimientos y reparaciones

`POST /api/mantenimientos` exige `clase: "PREVENTIVO" | "CORRECTIVO"`. `tipo` describe el trabajo. `monto` es el total cobrado por el taller, incluida mano de obra y sus materiales. Los materiales propios generan salidas de inventario, no un segundo desembolso. Crear el trabajo no implica que esté pagado. Los trabajos históricos quedan sin clasificación; no se infiere una ni se inventan pagos.

Solo los trabajos `PREVENTIVO` pueden vincular planes al crearse, al finalizarse o mediante la acción de cumplimientos. El selector muestra planes activos del mismo vehículo, excluye los ya vinculados y permite marcarlos con casillas. Los cumplimientos existentes se consultan aparte, en «Planes cumplidos por este trabajo». Cambiar vehículo o clase limpia la selección. Los correctivos pueden finalizarse normalmente, sin planes. Los vínculos históricos se conservan.

Cada trabajo utiliza una vía de pago:

- **Directa:** omitir `id_factura_proveedor`. Desde Ver detalle se registran pagos parciales o completos mediante `POST /api/mantenimientos/:id/pagos`, con `fecha`, `monto`, `numero_comprobante` y `observacion` opcionales. Permiso `mantenimientos.pagar` para jefe y operador. Cada pago crea un gasto de origen `MANTENIMIENTO`.
- **Con factura:** registrar primero la factura externa y seleccionarla al crear el trabajo, junto con su proveedor. Debe estar vigente, tener el mismo total y no estar asignada a otro trabajo. Una factura completa por trabajo; la vía no se cambia después. Los pagos se registran en Pagos a proveedores y se reflejan una sola vez en Gastos. Los pagos vigentes previos de esa factura también se incorporan al vincularla.

La fecha de pago debe ser igual o posterior al inicio del trabajo. Los abonos no pueden superar el saldo, incluso si se envían simultáneamente. `GET /api/mantenimientos/:id` incluye `pagos`, `total_pagado` y `saldo_pendiente`.

Los pagos directos se anulan desde Gastos; los que proceden de factura se anulan desde Pagos a proveedores y su gasto asociado se anula automáticamente. Antes de anular el trabajo hay que anular sus pagos y su factura, si existe. El informe de gastos cuenta los desembolsos, no suma nuevamente el monto del trabajo ni el pago de proveedor que les dio origen. No equivale a un estado completo de caja de todas las compras.
