# Facturas externas y cobros a clientes

Aplicar `database/migrations/028_facturas_cobros_cliente.sql` después de las migraciones anteriores. Aplicar también `database/migrations/041_empresas_facturacion_agrupada.sql`, en orden después de las anteriores. Una instalación nueva usa `database/schema.sql`. El servidor no aplica migraciones al iniciar.

JEFE y OPERADOR pueden consultar, crear y anular facturas y cobros. Ambos tienen ahora todos los permisos de liquidaciones. Se requiere sesión, contraseña definitiva y protección CSRF en escrituras, como en los demás módulos.

## Flujo

1. Crear, preparar y confirmar las liquidaciones de las gasolineras de la empresa.
2. Registrar la factura emitida por otro medio. No se emite ni se anula electrónicamente ningún documento fiscal desde esta aplicación.
3. Registrar cobros parciales o completos hasta cubrir el saldo.

Solo existe una factura **vigente** por liquidación. Se conservan las anuladas y se puede registrar una nueva con otro número mientras la liquidación siga confirmada. El número de factura permanece único incluso tras anularla.

Una factura reúne entre 1 y 200 liquidaciones confirmadas de una misma empresa. El servidor suma `subtotal = valor_transporte + recargo`, `retencion` y `valor_neto = total_liquidacion` de todas las seleccionadas. No admite importes enviados por el cliente ni inventa impuestos adicionales. Conserva la retención y los recargos calculados en cada liquidación, sin recalcularlos a nivel de empresa.

Las facturas tienen estado REGISTRADA/ANULADA. `estado_cobro` es calculado: PENDIENTE, PARCIAL, COBRADA o ANULADA. `total_cobrado` suma únicamente cobros REGISTRADOS; `saldo` es el neto menos esa suma (cero en facturas anuladas). `vencida` indica saldo pendiente y fecha de vencimiento anterior a la fecha del servidor.

## Rutas

| Método | Ruta | Operación |
|---|---|---|
| GET | `/api/facturas-cliente` | Listado y cuentas por cobrar |
| GET | `/api/facturas-cliente/:id` | Detalle, entregas e historial de cobros |
| POST | `/api/facturas-cliente` | Registrar factura externa |
| POST | `/api/facturas-cliente/:id/anular` | Anular sin cobros vigentes |
| GET | `/api/cobros-cliente` | Listar cobros |
| GET | `/api/cobros-cliente/:id` | Consultar cobro |
| POST | `/api/cobros-cliente` | Registrar cobro |
| POST | `/api/cobros-cliente/:id/anular` | Anular cobro y restituir saldo |

Facturas aceptan filtros `id_empresa`, `id_liquidacion`, `id_gasolinera`, `estado`, `estado_cobro`, `fecha_desde`, `fecha_hasta`. Cobros aceptan `id_empresa`, `id_factura`, `id_gasolinera`, `estado`, `fecha_desde`, `fecha_hasta`. Las fechas filtran emisión o cobro respectivamente. Ambos listados usan `limit` (1–200, predeterminado 50) y `offset` (predeterminado 0).

Factura:
```json
{"id_empresa":1,"id_liquidaciones":[1,2],"numero_factura":"001-001-000000001","fecha_emision":"2026-10-30","fecha_vencimiento":"2026-11-30","observacion":"Emitida externamente"}
```
Vencimiento y observación son opcionales; el vencimiento no puede preceder a la emisión.

Cobro:
```json
{"id_factura":1,"fecha_pago":"2026-10-30","monto":"50.00","forma_pago":"TRANSFERENCIA","banco":"Banco","numero_comprobante":"ABC123","observacion":null}
```
Formas: EFECTIVO, TRANSFERENCIA, CHEQUE, OTRO. Banco y observación son opcionales; transferencia y cheque requieren `numero_comprobante` (el número de cheque en este último caso). El monto es positivo, de hasta dos decimales, y no supera el saldo; la fecha no precede a la emisión. La respuesta incluye la factura con su saldo actualizado.

Anulación de factura o cobro:
```json
{"motivo":"Registro incorrecto"}
```
Motivo obligatorio de hasta 150 caracteres. No hay edición general ni eliminación de estos registros. Para corregir: anular cobros vigentes, anular factura, luego registrar otra factura o anular la liquidación. Una liquidación borrador se elimina; no se anula.

Los bloqueos transaccionales coordinan facturación, cobros y liquidaciones; evitan cobros excedidos y facturas simultáneas. Las restricciones y triggers conservan el historial. Se guardan usuario de registro/anulación y fechas; esto no agrega un módulo de auditoría general.

## Frontend

Facturas y cobros usan `CatalogoConectado`, filtros, orden, paginación y modales compartidos. La factura se puede registrar desde el detalle de liquidación y el cobro desde el detalle de factura. La tabla muestra detalle y anulación; no ofrece edición/eliminación inexistentes. El formulario permite seleccionar una empresa y marcar sus liquidaciones disponibles mediante casillas. El detalle muestra las liquidaciones agrupadas. Cobros y saldos pertenecen a la factura y a la empresa; no se distribuyen arbitrariamente entre gasolineras.

## Migración de datos anteriores

028 conserva las tablas `factura` y `pago`. Convierte estados anteriores PENDIENTE/PAGADA/PARCIAL de factura a REGISTRADA; los cobros existentes se consideran registrados. Usuarios de registros antiguos pueden ser nulos. Si existen estados desconocidos o importes/fechas incompatibles, la migración falla y revierte: revisar esos registros antes de reintentarlo, sin corregir importes automáticamente. Realizar respaldo previo al aplicarla en una base con información real.

## Empresas y relación con gasolineras

`GET/POST /api/empresas` y `GET/PUT/DELETE /api/empresas/:id` usan los permisos comunes de catálogos. Campos: `nombre` (razón social, obligatorio), `ruc` (13 dígitos, único, obligatorio para altas/ediciones) y `estado` (booleano). No se elimina una empresa con registros asociados.

Crear o editar gasolineras requiere `id_empresa`; el RUC se consulta desde la empresa. Una gasolinera ya facturada no puede trasladarse a otra empresa. Desactivar una empresa impide emitirle nuevas facturas.

041 convierte la relación antigua en `factura_liquidacion` y conserva las asociaciones de facturas anuladas. Anular una factura sin cobros vigentes libera todas sus liquidaciones para volver a facturarlas. Una liquidación solo puede anularse si no tiene factura vigente.

La conversión agrupa gasolineras por RUC conocido y usa provisionalmente el nombre de una gasolinera como nombre de empresa. Revisar las razones sociales resultantes. La migración 042 admite documentos históricos sin liquidaciones mediante un servicio interno para el importador. La carga del Excel queda pendiente. Véase database/migrations/042_documentos_historicos.md.

Los saldos incluyen importe_pagado_previo, separado de los movimientos de caja. Una factura histórica conserva archivo, hoja, fila y huella de origen. Las rutas ordinarias de creación mantienen sus requisitos.
