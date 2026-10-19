# Convenciones de servicios

Los servicios coordinan casos de uso: validan entradas mediante los validadores,
aplican reglas de negocio, llaman a los modelos y componen los resultados.
Los controladores adaptan HTTP; los modelos ejecutan SQL y devuelven datos.

## Estructura

- Usar CommonJS, cuatro espacios, punto y coma y funciones declaradas como
  `const nombre = async (...) => { ... };`. Mantener síncronas las funciones que
  ya lo sean, incluidos los delegadores que devuelven promesas.
- Declarar las operaciones antes de `module.exports` y exportarlas por nombre.
- Usar bloques con llaves en condiciones y bucles.
- Nombrar los modelos según su entidad (`gastoModel`, `vehiculoModel`) y las
  entradas validadas como `datosValidados`; usar nombres descriptivos para resultados.
- Conservar los nombres públicos existentes (`get...`, `find...`, `create...`, etc.)
  porque los consumen controladores y otros servicios. La uniformidad de estructura
  no requiere renombrar esos contratos.

## Validación y errores

Validar antes de escribir. La estructura y los tipos pertenecen a los validadores;
la existencia de referencias y las reglas que requieren datos pertenecen al servicio.
Usar `throw createHttpError(mensaje, status)` para errores esperados, conservando
el mensaje y estado de cada contrato: 400 para entradas inválidas, 404 para recursos
no encontrados y 409 para conflictos de negocio. Propagar los errores inesperados.

## Transacciones

El servicio que inicia una operación compuesta obtiene una conexión, ejecuta
`BEGIN`, realiza las validaciones y escrituras con esa misma conexión, y termina
con `COMMIT`. Ante un error ejecuta `ROLLBACK` y lo propaga; siempre libera la
conexión en `finally`. Conservar los bloqueos y su orden.

Los colaboradores que reciben un `client` (por ejemplo, costos automáticos,
viáticos y recepciones dentro de una compra) participan en la transacción del
llamador: no abren otra conexión, no confirman ni liberan la recibida.
Las lecturas o escrituras simples pueden delegar directamente al modelo.

Evitar SQL de negocio en servicios: únicamente administran las sentencias de
control transaccional. Mantener los cálculos monetarios existentes en PostgreSQL
y los decimales devueltos como texto.
