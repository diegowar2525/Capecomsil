# Catálogo de vehículos

Este módulo utiliza la API real y requiere una sesión activa. Vite redirige
`/api` al backend configurado en `vite.config.js`.

- `VehiculosPage.jsx`: listado, búsqueda local, apertura de acciones y mensajes de éxito.
- `hooks/useVehiculos.js`: listado, guardado, eliminación y consulta de kilometraje; actualiza los datos tras cada escritura.
- `hooks/useVehiculo.js`: consulta individual cancelable para detalle y edición.
- `services/vehiculos.api.js`: endpoints del módulo; delega cookies, CSRF y errores en `src/services/http.js`.
- `domain/vehiculo.js`: transforma el formulario al contrato de la API, conserva decimales y fechas locales, convierte opcionales vacíos a null y comprueba el par kilometraje/fecha.
- `components/VehiculoModal.jsx`: compone el Modal compartido y recibe las operaciones del hook, sin importar servicios.
- `VehiculoForm.jsx`, `VehiculoDetalle.jsx`, `VehiculoEliminar.jsx` y `VehiculoKilometraje.jsx`: vistas separadas dentro de components.
- `vehiculos.fields.js`, `vehiculos.columns.js`, `vehiculos.actions.js` y `vehiculos.config.js`: definición visual del catálogo.

Editar carga el GET individual antes de mostrar el formulario. Guardar y eliminar
actualizan la tabla con la respuesta del servidor. El formulario conserva los
datos ante errores y bloquea envíos duplicados mientras procesa la petición.
Los campos son controlados mediante `src/hooks/useForm.js`, compartido con perfil,
y reutilizan FormField. El preparador recibe un objeto de valores, no FormData.
El backend sigue siendo la autoridad de permisos, validaciones y dependencias.
No se añaden restricciones por rol en el navegador.

El kilometraje se consulta con una fecha/hora local opcional, sin convertirla a UTC.
Una fecha vacía utiliza el corte actual que calcula el servidor.
