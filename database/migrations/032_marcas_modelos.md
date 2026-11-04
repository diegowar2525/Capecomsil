# 032 — Marcas y modelos

Aplicar una vez después de 031 sobre una base existente. Para una instalación nueva usar schema.sql; no volver a ejecutar esta migración.

Crea marca (ámbito VEHICULO o PRODUCTO) y modelo (pertenece a una marca), y relaciona vehículos/productos mediante id_marca e id_modelo. Los nombres ignoran mayúsculas y espacios repetidos al detectar duplicados. No se fusionan marcas de ámbitos distintos.

Migra los textos existentes y conserva las columnas marca_anterior/modelo_anterior como respaldo. Un modelo antiguo sin marca se conserva y se muestra como dato anterior hasta completar su asociación. No se inventan marcas.

Desactivar impide nuevas asociaciones, pero conserva las existentes. Eliminar solo es posible sin referencias (una marca con modelos también está en uso). Renombrar actualiza el nombre mostrado en todos los registros asociados.

La API de vehículos y productos recibe id_marca/id_modelo en lugar de textos marca/modelo. Las consultas conservan marca/modelo como nombres legibles. Vehículos requiere ambos IDs; productos permite dejarlos vacíos, pero un modelo exige su marca.

El frontend administra estas tablas dentro del formulario: buscar, seleccionar, crear expresamente, renombrar, desactivar/reactivar o eliminar. Crear una marca/modelo se guarda inmediatamente, aunque se cancele el formulario principal.
