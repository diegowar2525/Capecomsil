# Convenciones de validadores

Los validadores comprueban y normalizan entradas de forma síncrona. Reciben datos,
devuelven valores normalizados o lanzan un error; no consultan modelos, no abren
transacciones ni acceden a objetos HTTP. Las reglas que necesitan consultar datos
persistidos corresponden a los servicios.

- Usar CommonJS, cuatro espacios, punto y coma y funciones
  `const validateNombre = (...) => { ... };`.
- Declarar las funciones antes de `module.exports` y exportarlas por nombre.
- Usar llaves en condiciones y bucles; los callbacks breves pueden usar expresiones.
- Usar `throw createHttpError(mensaje, 400)` para errores de entrada. Conservar
  los mensajes públicos y el orden de validación existente.
- Usar `data` para cuerpos, `query` para filtros y `value` para valores individuales.
  Conservar los nombres exportados y los campos de los objetos devueltos.
- Reutilizar `common.validators.js` para IDs, fechas, horas locales, decimales,
  textos opcionales y URLs de imagen cuando su contrato corresponda al campo.

La estandarización no unifica reglas que tienen contratos distintos. Por ejemplo,
inventario admite un offset numérico, mientras otros filtros exigen texto cuando
se proporciona. Tampoco deben reemplazarse automáticamente validaciones de texto
con límites distintos o que cuentan caracteres Unicode de otra manera.

Preservar la distinción entre ausente, null, cadena vacía, cero y false, los valores
predeterminados y la normalización propia de cada campo. Los importes validados
como decimales siguen siendo texto; las fechas y horas locales no adquieren una
zona horaria implícita.

Los errores internos de bibliotecas pueden capturarse y convertirse al error de
entrada correspondiente, como ocurre al interpretar una URL de imagen.
