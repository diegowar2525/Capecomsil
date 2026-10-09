# Pagos a proveedores

Cada pago se aplica a una factura. Una factura admite varios abonos. Los importes se calculan con PostgreSQL NUMERIC y se devuelven como texto decimal.

## Registrar un pago

`POST /api/pagos-proveedor`

```json
{
  "id_factura_proveedor": 1,
  "fecha_pago": "2026-10-08",
  "monto": "20.10",
  "forma_pago": "TRANSFERENCIA",
  "numero_comprobante": "TRX-001",
  "observacion": "Primer abono"
}
```

Obligatorios: factura, fecha real en formato YYYY-MM-DD, monto positivo con hasta dos decimales y forma de pago. Las formas admitidas son `EFECTIVO`, `TRANSFERENCIA`, `CHEQUE` y `OTRO`; se normalizan a mayúsculas. Transferencia exige `numero_comprobante` y cheque exige `numero_cheque`. El número de cheque no se admite con otras formas de pago. Comprobantes y cheques no son únicos: se puede repartir una transferencia entre facturas mediante pagos separados.

La respuesta 201 incluye el pago, `total_pagado`, `saldo_pendiente` y `estado_pago` de su factura después de la operación. Se ignoran estados o saldos enviados en el body: los controla el backend. El pago no genera gastos adicionales ni movimientos de inventario y no exige haber recibido los productos.

## Consultas

| Ruta GET | Resultado |
| --- | --- |
| `/api/pagos-proveedor` | Pagos vigentes y anulados. |
| `/api/pagos-proveedor/:id` | Un pago, incluidos sus datos de anulación. |
| `/api/facturas-proveedor/:id/pagos` | Pagos de la factura. |
| `/api/proveedores/:id/cuentas-por-pagar` | Facturas no anuladas con saldo positivo, ordenadas por vencimiento. |
| `/api/facturas-proveedor` y `/api/facturas-proveedor/:id` | Facturas con resumen de pagos y saldo. |

Los listados de pagos admiten `id_factura_proveedor`, `id_proveedor`, `fecha_desde`, `fecha_hasta`, `estado` (`REGISTRADO` o `ANULADO`), `limit` (predeterminado 50, máximo 200) y `offset` (predeterminado 0). En la ruta de pagos de una factura, el ID de la ruta tiene prioridad. Fechas inclusivas; orden por fecha y luego ID descendentes. Las cuentas por pagar devuelven todas las facturas pendientes del proveedor, incluidas las vencidas.

```text
GET /api/pagos-proveedor?id_proveedor=1&estado=REGISTRADO&fecha_desde=2026-10-01&fecha_hasta=2026-10-31
```

`factura_proveedor.estado` es operativo: `REGISTRADA` o `ANULADA`. El estado financiero se calcula al consultar:

- `total_pagado`: suma de pagos REGISTRADO, excluyendo anulados.
- `saldo_pendiente`: total de factura menos total pagado.
- `estado_pago`: PAGADA si el saldo es cero, PARCIAL si hay abonos y saldo, PENDIENTE si no hay abonos. Una factura de total cero se considera PAGADA sin admitir pagos.
- `vencida`: factura no anulada con saldo positivo y vencimiento anterior al día actual en America/Guayaquil. Sin fecha de vencimiento devuelve false; el propio día de vencimiento todavía no está vencida.

Los importes y `estado_pago` de una factura anulada se muestran como historial; dicha factura no aparece en cuentas por pagar ni admite nuevos pagos.

## Anular una factura de compra

`POST /api/facturas-proveedor/:id/anular`

```json
{
  "motivo": "Factura registrada por error"
}
```

Exige motivo (hasta 150 caracteres) y devuelve 200 con la factura y sus detalles. Registra `estado=ANULADA`, `fecha_anulacion` automática y `motivo_anulacion`. Conserva importes, número de factura, detalles y todas las operaciones históricas. El número de factura continúa reservado para ese proveedor.

Si hay pagos REGISTRADO o recepciones REGISTRADA, devuelve 409 e indica qué registros deben anularse primero mediante sus endpoints existentes. No anula dependencias automáticamente. Si los productos recibidos ya fueron consumidos y no existe stock suficiente, la anulación de la recepción se rechazará; esa situación debe resolverse antes de anular la factura. No se debe generar un ajuste ficticio para eludir ese control.

La operación bloquea la factura en una transacción, igual que las altas de pagos y recepciones. Una segunda anulación devuelve 409; un ID inexistente, 404; motivo o ID inválido, 400. Una factura anulada no admite pagos ni recepciones y queda fuera de cuentas por pagar. Sus saldos calculados y cantidades pendientes en las consultas históricas no constituyen una deuda o entrega exigible: debe considerarse su estado ANULADA.

La anulación no crea movimientos adicionales de inventario: las reversiones ya se realizaron al anular las recepciones. Para bases anteriores, `database/migrations/007_anulacion_factura_proveedor.sql` incorpora las dos columnas de auditoría sin borrar datos; el esquema final también las incluye. Las facturas anuladas previamente por SQL pueden conservar ambos campos nulos, ya que no se inventa su fecha ni motivo histórico.

## Anular un pago

`POST /api/pagos-proveedor/:id/anular`

```json
{
  "motivo": "Pago registrado en la factura incorrecta"
}
```

El motivo es obligatorio (hasta 150 caracteres). La respuesta 200 conserva el pago original con estado ANULADO, fecha y motivo de anulación, además del saldo actualizado. No hay PUT ni DELETE: para corregir un pago se anula y se registra el correcto.

Altas y anulaciones bloquean la misma factura dentro de una transacción. Esto impide sobrepagos por solicitudes simultáneas y evita registros parciales ante fallos. Un segundo intento de anulación devuelve 409. El backend no envía transferencias bancarias: registra pagos realizados.

Errores: 400 datos inválidos; 404 pago/factura/proveedor inexistente al consultar un recurso; 409 factura anulada, sobrepago o pago ya anulado. Los filtros de un listado sin coincidencias devuelven una lista vacía.

## Base de datos

El esquema final está consolidado en `database/schema.sql`. Para actualizar una base anterior, ejecutar una sola vez `database/migrations/006_pagos_proveedor.sql`; no ejecutarla sobre un esquema nuevo que ya contiene esas columnas.

PAGO_PROVEEDOR incorpora `estado`, `fecha_anulacion` y `motivo_anulacion`. La migración conserva pagos y facturas existentes, y transforma los antiguos estados financieros de factura en REGISTRADA. El estado financiero pasa a derivarse exclusivamente de los pagos: no se inventan pagos para facturas antiguamente marcadas PAGADA. Las restricciones abortan la migración si hay estados operativos desconocidos.
