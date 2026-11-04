# Provincias y ciudades

Aplicar `031_provincias_ciudades.sql` una sola vez sobre la base existente, después de la migración 030. Las instalaciones nuevas ya incluyen estos cambios en `schema.sql`.

Crea provincia y ciudad, con nombres únicos (sin distinguir mayúsculas ni espacios exteriores). Una ciudad pertenece a una provincia; su nombre puede repetirse en otra provincia.

Añade `id_ciudad` opcional a gasolinera y terminal. Conserva las direcciones y deja los registros existentes sin ciudad hasta completarlos. No asigna ubicaciones por suposición ni añade coordenadas. Las referencias impiden eliminar provincias o ciudades en uso; se pueden desactivar.

La provincia mostrada en gasolineras y terminales se obtiene de la ciudad y no se almacena por separado.
