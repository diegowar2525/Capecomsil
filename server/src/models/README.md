# Convenciones de los modelos

Los modelos encapsulan consultas PostgreSQL. Los servicios validan entradas,
coordinan operaciones y administran BEGIN, COMMIT, ROLLBACK y la liberación del client.

## Estructura

- CommonJS, funciones async con cuerpo explícito y exportaciones al final.
- SQL multilínea, parámetros `$1`, `$2`, etc. y valores en un arreglo separado.
- Usar `const result = await client.query(...)` y retornar el resultado explícitamente.
- Preferir nombres como `data`, `filtros`, `idChofer` e `idVehiculo` frente a abreviaturas.
- `id` representa el identificador del recurso del método; describir otros identificadores.
- Mantener separados imports, fragmentos SQL constantes, funciones y exportaciones.
- Los fragmentos SQL compartidos son constantes internas, nunca valores recibidos por HTTP.

## Conexiones y transacciones

Hay dos firmas intencionales:

```js
// Consulta o CRUD de catálogo que puede ejecutarse de forma independiente.
findById(id, client = pool)
update(id, data, client = pool)

// Operación que debe participar en una transacción coordinada por el servicio.
create(client, data)
findByIdForUpdate(client, id)
findByIdForShare(client, id)
```

El client opcional siempre va al final. El client obligatorio va primero y no tiene
valor predeterminado: no debe sustituirse accidentalmente por el pool. Los métodos
con bloqueos requieren una transacción abierta para conservar el bloqueo durante
las operaciones relacionadas. Dentro de una transacción, pasar el mismo client a
todas las consultas, incluidas las lecturas.

## Resultados

- Consultas de listas: `result.rows`, con `[]` cuando no hay resultados.
- Operaciones que retornan una fila: `result.rows[0] ?? null`.
- Consultas escalares: devolver el valor documentado, por ejemplo un booleano,
  un identificador o un importe decimal. No convertir indiscriminadamente a null.
- Los servicios convierten la ausencia de un registro en el error correspondiente.
- Conservar los cálculos NUMERIC, formatos de fecha y campos de respuesta de cada API.

No todos los modelos necesitan CRUD completo. Los modelos de detalles, historial e
informes deben exponer únicamente las operaciones que utiliza el sistema.

## Separación de responsabilidades pendiente

`costo_viaje` y `viatico_chofer` todavía coordinan operaciones y generan errores HTTP;
`remuneracion_chofer.generar` recorre el período solicitado. Esa separación hacia
servicios queda para una refactorización posterior con sus pruebas. La función SQL
`recalcular_remuneracion`, las restricciones y los triggers conservan sus reglas
actuales. El cambio de formato y contratos no traslada ni modifica esas reglas.
