# Trayectos

| Método | Ruta | Operación |
|---|---|---|
| GET | /api/trayectos | Listar, incluidos inactivos |
| GET | /api/trayectos/:id | Consultar uno |
| POST | /api/trayectos | Crear |
| PUT | /api/trayectos/:id | Actualizar objeto completo |
| DELETE | /api/trayectos/:id | Eliminar si no tiene historial |

POST y PUT reciben (sustituir IDs por los existentes):

```json
{
  "nombre": "Mechita → La Troncal",
  "id_gasolinera_origen": 2,
  "id_terminal_destino": 1,
  "kilometros": "11.00",
  "estado": true,
  "observacion": "Distancia estimada de prueba, pendiente de confirmar"
}
```

Cada extremo debe indicar exactamente una gasolinera o un terminal; los campos no usados se omiten o envían como null. El recorrido inverso es otro trayecto. Se permiten caminos alternativos entre las mismas ubicaciones, identificados por su nombre.

El nombre es obligatorio, máximo 150 caracteres. Los kilómetros deben ser positivos, con máximo 8 enteros y 2 decimales. Estado es booleano (predeterminado true); observacion es opcional. PUT es reemplazo completo: enviar también el estado deseado y las ubicaciones, no solo el campo modificado.

GET incluye nombre_origen y nombre_destino. POST devuelve 201, consulta/actualización/eliminación 200. Datos inválidos o ubicaciones inexistentes: 400. Trayecto no encontrado: 404. Eliminar un trayecto utilizado o cambiar sus extremos: 409. Para retirarlo, enviar PUT con estado false y sus demás datos.

Los triggers y claves foráneas protegen el historial incluso frente a escrituras concurrentes. Se pueden cambiar nombre, observación, estado y kilómetros de un trayecto usado; los kilómetros nuevos solo afectan a futuros registros.

Al crear un viaje se envía `tramos: [{"orden":1,"id_trayecto":1}, ...]`. El backend consulta trayectos activos, copia sus kilómetros y suma el recorrido automáticamente. No calcula las distancias mediante mapas ni crea trayectos automáticamente. Los tramos siguen guardándose junto con el viaje en una transacción.
