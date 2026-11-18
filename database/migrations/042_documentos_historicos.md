# 042 — Documentos históricos y saldos previos

Aplicar después de 041. Para una base nueva usar schema.sql (ya incluye 042), sin repetir esta migración. No se ha aplicado a la base de trabajo ni se ha cargado Excel.

## Datos

Ambas facturas incorporan historico, importe_pagado_previo, fecha_corte, archivo_origen, hoja_origen, fila_origen y huella_origen (SHA256). El origen es único por tipo de documento, archivo/huella, hoja y fila.

- Clientes: empresa obligatoria, sin liquidaciones ficticias. Total es el neto cobrable; subtotal se obtiene como neto + retención documentada.
- Proveedores: total original conocido, sin conceptos ficticios, sin recepción de inventario. Subtotal, impuestos y descuento se conservan NULL si no están documentados.
- Saldo = total/neto − importe pagado previo − pagos vigentes registrados.
- El importe previo representa pagos anteriores al corte, sin inventar sus fechas. No genera movimientos ni gasto del período.
- Los pagos posteriores se registran por las rutas actuales y deben ser iguales o posteriores al corte. Se conserva el límite de saldo.
- Una factura con importe previo reconocido no puede anularse desde el flujo ordinario. Su corrección necesita conciliación del origen.
- Facturas anuladas en origen se conservan con motivo; no se inventa fecha de anulación.

## Entrada para el futuro importador

Servicio interno: server/src/services/documentos_historicos.service.js.

create(tipo, datos) controla la transacción. createEnTransaccion(client, tipo, datos) participa en la transacción del importador; este debe abrirla, confirmarla o revertirla. tipo es CLIENTE o PROVEEDOR. No se añade una ruta pública ni se permite saltar las validaciones de las altas ordinarias.

Campos: id_empresa o id_proveedor, numero_factura, fecha_emision, fecha_vencimiento opcional, total obligatorio (neto para clientes), retencion para clientes, importe_pagado_previo, fecha_corte, archivo_origen, hoja_origen, fila_origen, huella_origen. estado predeterminado REGISTRADA; ANULADA requiere motivo_anulacion y saldo previo cero.

Para enero usar fecha_corte 2026-01-01. El pago previo solo puede existir en una factura anterior al corte. Los documentos de enero sin pagos previos también pueden conservarse como históricos.

La factura 133 podrá asociarse a MAXFUEL con sus importes documentados y sin liquidaciones. No se ha importado aún; corresponde al punto 5.

## Consulta

Resumen → Cuentas por cobrar agrupa por empresa, muestra vencimientos, facturas, cobros (incluyendo su estado) y liquidaciones por gasolinera. No reparte abonos entre estaciones. Impresión/PDF incluye el mismo desglose completo. Documentos históricos muestran la procedencia y el pago previo separado.
