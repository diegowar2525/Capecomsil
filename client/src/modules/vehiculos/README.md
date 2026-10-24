# Catálogo de vehículos

VehiculosPage configura CatalogoConectado con sus campos, columnas, filtros y
acciones. Comparte el listado, formularios, detalle y confirmación de eliminación
con los demás catálogos.

- hooks/useVehiculos.js utiliza useCatalogo para el listado y las operaciones.
- services/vehiculos.api.js conserva los endpoints y expone el adaptador api.
- domain/vehiculo.js prepara los valores y valida el par kilometraje/fecha.
- vehiculos.actions.js define la consulta adicional de kilometraje. La página la
  marca como query para consultar por fecha sin cerrar el modal ni escribir datos.
- useRegistroCatalogo carga el registro completo antes de editar.
- CatalogoModal y useForm gestionan los campos controlados, errores y bloqueo de
  envíos duplicados. Ya no existen modales ni hooks de registro exclusivos del módulo.

Se mantienen las cookies de sesión, CSRF, fechas locales y decimales. El backend
valida los permisos y dependencias. Utiliza la paginación, el ícono de orden y los filtros avanzados compartidos.
