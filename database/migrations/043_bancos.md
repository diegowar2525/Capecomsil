# Bancos en cobros a clientes

La migración crea `banco` y añade `pago.id_banco`. Agrupa nombres existentes ignorando mayúsculas y espacios repetidos, sin cambiar el texto histórico ni los importes de los cobros. No modifica pagos a proveedores.

Desde `server`, ejecutar `node scripts/aplicar-bancos.js`. El script usa una transacción, bloquea la tabla durante la vinculación y comprueba que los datos originales se conserven. Rechaza repetir la aplicación si la tabla ya existe.

El catálogo usa los permisos `catalogos.consultar/crear/editar/eliminar`. Un banco asociado a cobros no puede eliminarse; puede desactivarse. Los nuevos cobros requieren un banco activo cuando se informa alguno. El banco sigue siendo opcional. Renombrarlo no cambia el nombre conservado en cobros anteriores.

La API admite `id_banco`. Los importadores que aún envían `banco` como texto siguen funcionando y se vinculan al catálogo automáticamente. No se fusionan entidades distintas por similitud de nombres.

En los formularios, la lupa abre la búsqueda y creación; el engranaje permite administrar el registro seleccionado. Provincias y ciudades reutilizan este componente, manteniendo sus tablas y pantallas independientes.
