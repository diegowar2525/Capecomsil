# Mantenimientos: factura, gasto inmediato y edición

Aplicar `030_edicion_mantenimiento.sql` una sola vez después de la migración 029, antes de iniciar esta versión. `schema.sql` ya incluye ambas para bases nuevas. No se ha ejecutado esta migración en la base de trabajo.

## Registrar un trabajo

`POST /api/mantenimientos` conserva los campos del trabajo, materiales y planes, y admite `modalidad_pago`:

- `DIRECTO`: sin factura, se considera pagado. `monto` es el total del taller; `numero_comprobante` es opcional. Se crea automáticamente un gasto por ese importe con la fecha de `fecha_inicio`. Con importe cero no se crea un gasto de valor cero. No permite pagos posteriores ni anular ese gasto de forma independiente: se corrige o anula desde el mantenimiento.
- `NUEVA`: recibe `factura` con los mismos datos y conceptos que Facturas a proveedores: número, fechas, líneas, descuentos e impuestos. El proveedor se toma del mantenimiento. Se reutiliza el servicio de facturas y su cálculo decimal; no se introduce `monto` por segunda vez. Requiere también `compras.crear`. No recibe materiales del taller en inventario: los conceptos facturados corresponden al cobro externo.
- `EXISTENTE`: recibe `id_factura_proveedor`. Debe corresponder al proveedor y estar vigente, sin vinculación previa a otro trabajo. El total de la factura determina el monto del mantenimiento.

Sin `modalidad_pago`, una factura identificada se interpreta como `EXISTENTE`; de lo contrario se usa `DIRECTO`. Para las dos modalidades con factura, los pagos siguen registrándose desde Pagos a proveedores. Crear la factura no paga el trabajo.

Todo se guarda en una transacción: factura, trabajo y gasto automático, según corresponda. **Los mantenimientos ya no generan ni revierten movimientos de inventario** al crear, editar o anular. Los materiales propios se descuentan mediante los ajustes manuales existentes; los materiales externos se incluyen en la factura. Las entradas por compras y sus reversiones se conservan.

El formulario ofrece solo «Con factura» (`NUEVA`) y «Sin factura» (`DIRECTO`). El modo `EXISTENTE` se conserva por compatibilidad en la API y para editar trabajos con factura vinculada, sin ofrecerlo como una tercera opción de creación. La sección se llama «Factura».

La primera línea de la factura corresponde al servicio: tipo `SERVICIO`, cantidad inicial 1 y descripción sincronizada con «Trabajo realizado». No se elimina esa línea; se pueden añadir conceptos adicionales. El servidor también establece su tipo y descripción a partir del trabajo. Precio e impuesto deben completarse según la factura. Los campos opcionales están señalados, incluido el proveedor cuando se registra sin factura, fin, descripción, observación, comprobante, vencimiento y descuento.

## Editar e historial

`PUT /api/mantenimientos/:id` requiere los datos completos del trabajo y su `version`, sin motivo de modificación. Permiso `mantenimientos.editar`. Un trabajo anulado no puede editarse; una versión desactualizada produce 409.

El historial conserva usuario, fecha, versiones y los datos completos anteriores y posteriores. Se consulta desde Ver detalle → Historial de cambios o `GET /api/mantenimientos/:id/historial`, con permiso `mantenimientos.historial`. Ambos permisos se asignan a jefe y operador.

- El pago automático se sustituye conservando el gasto anterior anulado; fecha e importe siguen los del trabajo corregido. Anular el trabajo anula su gasto automático en la misma transacción.
- Los materiales y movimientos anteriores se conservan como historial. Editar o anular el trabajo no los cambia ni revierte. La API rechaza nuevos `detalles` de materiales; admite omitirlos o enviar una lista vacía. La corrección de stock se hace manualmente desde Inventario.
- La factura y la vía de pago no cambian al editar. Si hay factura, tampoco se cambia indirectamente su proveedor o total.
- Con planes cumplidos se conserva el vehículo, la clase preventiva y la finalización; se recalcula el kilometraje del cumplimiento cuando cambian las fechas. Se siguen validando cruces horarios.
- Los trabajos históricos no reciben gastos retroactivos. Conservan sus pagos anteriores y la acción de pago directo anterior. Si tienen pagos vigentes, se protegen sus referencias, importe y día de inicio.

## Viajes y otros motivos

Editar viajes ya no solicita motivo. Se conservan el historial, actor, fecha, versiones y las validaciones anteriores. `viaje_historial.motivo` admite nulos para nuevas ediciones y mantiene los motivos históricos. Clientes anteriores aún pueden enviarlo opcionalmente.

El cambio afecta a motivos de edición. Los motivos de anulación, ajustes de inventario y operaciones de seguridad conservan sus reglas específicas.
