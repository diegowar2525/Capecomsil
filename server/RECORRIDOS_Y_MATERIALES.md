# Categorías, llantas y materiales externos

## Categoría de llantas

`POST /api/categorias-producto`:

```json
{ "nombre": "Neumáticos", "es_llanta": true, "estado": true }
```

`es_llanta` admite booleanos, por defecto false. En PUT enviar el objeto completo, incluyendo este campo. No se permite cambiarlo si la categoría ya tiene productos. El nombre sí puede cambiarse.

## Producto

`POST /api/productos` (utilizar el ID real de la categoría):

```json
{
  "id_categoria": 1,
  "nombre": "Llanta para tanquero",
  "medida": "11R22.5",
  "marca": "Bridgestone",
  "modelo": "R268",
  "unidad_medida": "unidad",
  "condicion_llanta": "NUEVA",
  "stock_minimo": "2.00",
  "estado": true
}
```

La condición admite NUEVA o REENCAUCHADA (se recortan espacios y normalizan mayúsculas). Es obligatoria para categorías de llantas; para otros productos debe omitirse o ser null. PUT recibe los mismos campos. Con historial no se permite cambiar medida o condición; cada presentación debe tener su propio producto. Las consultas de stock incluyen medida, marca, modelo y condición.

## Mantenimiento mixto

`POST /api/mantenimientos`:

```json
{
  "id_vehiculo": 1,
  "id_proveedor": null,
  "fecha": "2026-10-10",
  "tipo": "Cambio de filtros y llanta",
  "monto": "25.00",
  "detalles": [
    { "origen_producto": "INVENTARIO", "id_producto": 3, "cantidad": "2.00" },
    {
      "origen_producto": "EXTERNO",
      "descripcion_producto": "Llanta nueva 315/80 R22.5 aportada por el taller",
      "cantidad": "1.00"
    }
  ]
}
```

Solo INVENTARIO comprueba stock y genera salidas. Si se omite origen_producto se asume INVENTARIO para conservar el contrato anterior. EXTERNO exige descripción de hasta 200 caracteres y no acepta id_producto. Se permiten varios materiales externos y un mantenimiento compuesto únicamente por externos. No se cambia automáticamente a EXTERNO cuando falta stock.

GET devuelve todos los detalles, incluidos los externos. Al anular solo se revierten los movimientos que realmente se generaron. Cabecera, detalles y movimientos se guardan en la misma transacción. El monto continúa siendo el importe informado para el mantenimiento, no un total calculado desde los materiales externos.
