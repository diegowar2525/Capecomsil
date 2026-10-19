# Convenciones de controladores

Los controladores adaptan HTTP a los servicios: leen `req.params`, `req.query` y
`req.body`, esperan el resultado y envían la respuesta. La validación y las reglas
de negocio se delegan a servicios y validadores; SQL y transacciones no pertenecen
a esta capa.

## Estructura

- CommonJS, cuatro espacios, punto y coma y funciones
  `const nombre = async (req, res, next) => { ... };`.
- Importar servicios al principio del archivo con nombres descriptivos en
  camelCase y sufijo `Service`, sin `require` dentro de las operaciones.
- Declarar todas las operaciones antes de `module.exports` y exportarlas por nombre.
- Dentro de `try`, esperar la llamada al servicio en `const resultado` y finalizar
  con `return res.status(codigo).json(...)`.
- En `catch (error)`, delegar con `next(error)` al middleware central. No enviar
  otra respuesta, ocultar errores ni duplicar su registro en el controlador.

```js
const getViajeById = async (req, res, next) => {
    try {
        const resultado = await viajesService.getViajeById(req.params.id);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};
```

## Compatibilidad HTTP

Conservar nombres exportados, argumentos enviados al servicio, códigos de estado
y cuerpos de respuesta. Las consultas suelen devolver 200 y las creaciones 201,
pero cada operación mantiene su contrato. Por ejemplo, generar remuneraciones
devuelve 200 y las operaciones bloqueadas mantienen el tratamiento existente de 403.

Algunas eliminaciones devuelven `{ message, entidad }` y otras directamente la
entidad. La uniformidad del código no cambia esos cuerpos ni introduce un sobre
genérico. Tampoco convierte los IDs o normaliza los filtros antes del servicio.
