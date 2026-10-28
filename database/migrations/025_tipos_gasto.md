# Catálogo de tipos de gasto

Para una base existente con las migraciones anteriores aplicadas, ejecutar
`025_tipos_gasto.sql` una sola vez antes de utilizar esta versión del servidor.
Para una base nueva, `database/schema.sql` ya incluye estos cambios: no ejecutar
ambos sobre la misma base.

La migración conserva los gastos, sus códigos e importes. Crea un tipo por cada
código histórico y los tipos reservados VIATICO y COMBUSTIBLE. La relación utiliza
el campo existente `gasto.tipo_gasto`, evitando modificar registros históricos.

API autenticada: GET/POST `/api/tipos-gasto` y GET/PUT/DELETE
`/api/tipos-gasto/:id`, con permisos `catalogos.consultar/crear/editar/eliminar`.
POST y PUT reciben `codigo`, `nombre`, `descripcion` opcional y `estado` booleano.
El código se normaliza a mayúsculas al crear y no se cambia al editar.

Los tipos usados no se eliminan (409); pueden desactivarse. Los reservados no se
eliminan ni desactivan. Los gastos nuevos exigen un tipo existente y activo.
COMBUSTIBLE se sigue registrando desde abastecimientos; VIATICO conserva su
vinculación con el viático diario. No se generan viáticos ficticios desde gastos.
