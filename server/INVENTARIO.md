# Consultas y ajustes de inventario

Todas las rutas usan el prefijo `/api`.

| Método y ruta | Resultado |
| --- | --- |
| `GET /inventario/stock` | Stock actual de todos los productos. |
| `GET /inventario/stock/:id` | Stock actual de un producto. |
| `GET /inventario/bajo-stock` | Productos cuyo saldo es menor que `stock_minimo`. |
| `GET /inventario/movimientos` | Historial ordenado por fecha e identificador descendentes. |
| `GET /facturas-proveedor/:id/recepciones` | Recepciones de la factura con sus detalles y estado. |
| `GET /facturas-proveedor/:id/pendientes-recepcion` | Cantidades facturadas, recibidas y pendientes por detalle de producto. |
| `POST /inventario/ajustes` | Registra una diferencia de inventario. |

El stock se calcula sumando entradas, restando salidas y sumando ajustes con su signo. Incluye productos inactivos y productos sin movimientos (saldo cero). Los valores decimales se devuelven como texto para conservar la precisión. El stock mínimo es un umbral informativo, no una cantidad reservada.

Ejemplo de historial filtrado:

```text
GET /api/inventario/movimientos?id_producto=3&fecha_desde=2026-10-01&fecha_hasta=2026-10-07&tipo_movimiento=AJUSTE&limit=50&offset=0
```

Todos los filtros son opcionales. `tipo_movimiento` admite `ENTRADA`, `SALIDA` o `AJUSTE`. Las fechas incluyen ambos días completos. `limit` tiene valor predeterminado 50 y máximo 200; `offset` comienza en 0. Los filtros afectan al historial, no al cálculo del stock actual.

Las recepciones incluyen también las anuladas para conservar su trazabilidad. Las cantidades recibidas se calculan únicamente con recepciones `REGISTRADA`. Los pendientes excluyen servicios e incluyen los productos totalmente recibidos con pendiente cero.

## Ajuste desde Postman

`POST /api/inventario/ajustes`, con JSON:

```json
{
  "id_producto": 3,
  "fecha": "2026-10-07",
  "cantidad": "-2.00",
  "motivo": "Diferencia detectada en conteo físico",
  "observacion": "Dos filtros deteriorados"
}
```

`cantidad` es la diferencia, no el saldo final: `-2.00` resta dos unidades y `2.00` añade dos. Admite hasta dos decimales y no puede ser cero. `fecha`, `id_producto`, `cantidad` y `motivo` son obligatorios; `observacion` es opcional.

La respuesta 201 contiene el movimiento y `stock_actual`. Un ajuste que dejaría saldo negativo devuelve 409; datos inválidos devuelven 400 y un producto inexistente devuelve 404. La operación bloquea el producto y calcula el saldo con PostgreSQL NUMERIC dentro de una transacción, coordinándose con los bloqueos de compras, recepciones y mantenimientos.

La validación protege el saldo actual acumulado; no reconstruye la disponibilidad que había en una fecha pasada.

## Anulaciones y reversiones

| Método y ruta | Operación |
| --- | --- |
| `POST /recepciones-compra/:id/anular` | Retira las cantidades recibidas y las deja pendientes de recibir nuevamente. |
| `POST /mantenimientos/:id/anular` | Devuelve los productos consumidos al inventario. |
| `POST /inventario/ajustes/:id/revertir` | Registra la diferencia contraria al ajuste manual original. |

Las tres operaciones reciben `{"motivo":"Registro incorrecto"}`. El motivo es obligatorio y admite hasta 150 caracteres. La fecha se registra automáticamente al ejecutar la operación.

Devuelven 200 con el registro original (actualizado al estado anulado cuando corresponde) y `reversiones`, una lista de movimientos inversos. Los movimientos originales se conservan; cada inverso usa `id_movimiento_revertido` para identificar su origen. Para ajustes, la fecha y el motivo de reversión están en ese movimiento inverso.

Una segunda anulación/reversión, intentar revertir un movimiento inverso, o no disponer del stock necesario devuelve 409. Los datos inválidos devuelven 400 y los registros inexistentes 404. Todas las modificaciones de cada operación se confirman juntas; si falla alguna, se revierten todas. Los mantenimientos sin productos también pueden anularse y devuelven una lista de reversiones vacía.

`mantenimiento` incorpora `estado` (`REGISTRADO`/`ANULADO`), `fecha_anulacion` y `motivo_anulacion`. `recepcion_compra` incorpora los dos últimos campos y conserva `REGISTRADA`/`ANULADA`. Son estados de operación, no los booleanos administrativos del catálogo.

El esquema final está en `database/schema.sql`. Para bases existentes anteriores a este cambio, `database/migrations/005_anulaciones.sql` añade las columnas conservando los datos; debe ejecutarse una sola vez y no sobre un esquema nuevo que ya incluya esas columnas.
