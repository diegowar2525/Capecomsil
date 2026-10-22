# Horarios y costos automáticos

Requiere la versión actual de `database/schema.sql`. Este archivo define una base vacía;
no debe ejecutarse sobre la base de trabajo para actualizarla. Esta entrega no aplica una migración ni borra datos.

## Configuraciones

Cada recurso admite `GET /`, `GET /:id`, `POST /`, `PUT /:id` y `DELETE /:id`:

| Ruta base | Campos específicos del body |
|---|---|
| `/api/configuraciones-combustible` | `consumo_galones_km`, `precio_por_galon` |
| `/api/configuraciones-viatico` | `importe_diario` |
| `/api/configuraciones-peaje-trayecto` | `id_trayecto`, `importe` |

Los tres reciben `fecha_inicio` (YYYY-MM-DD), `fecha_fin` opcional y `observacion` opcional.
PUT recibe el registro completo. Los importes se devuelven como texto decimal.

Ejemplo de configuración de combustible (valores ilustrativos, no cargados automáticamente):

```json
{
  "consumo_galones_km": "0.100000",
  "precio_por_galon": "3.0000",
  "fecha_inicio": "2026-01-01",
  "fecha_fin": null,
  "observacion": "Ejemplo para pruebas"
}
```

Para viáticos, sustituir los campos específicos por `"importe_diario": "12.00"`.
Para peajes, usar `"id_trayecto": 1, "importe": "0.00"` si ese sentido no tiene peaje.
Configurar todos los trayectos usados en el recorrido, incluyendo el retorno cuando corresponda.
No se presupone que el regreso cueste lo mismo ni se duplican kilómetros automáticamente.

Las fechas son inclusivas: dos períodos no pueden compartir el día límite. Los peajes
admiten vigencias simultáneas para distintos trayectos. Los demás importes deben ser mayores
que cero. No se elimina una configuración utilizada ni se alteran sus valores económicos;
se permite ajustar fechas solo conservando todos los días utilizados, incluso en viajes anulados.
Para un aumento, cerrar la vigencia anterior y crear otra para el día siguiente.

## Horarios

Viajes y mantenimientos reciben `fecha_inicio` y `fecha_fin` con fecha y hora local de Ecuador,
sin sufijo Z ni desplazamiento: `2026-10-16T08:00:00`.
Los viajes deben terminar después del inicio y dentro del mismo día.
Los mantenimientos pueden durar varios días; `fecha_fin: null` mantiene ocupado el vehículo
desde el inicio hasta su finalización o anulación.

No se permiten viajes simultáneos de un vehículo o chofer, ni mantenimientos que se crucen
entre sí o con viajes del mismo vehículo. Los anulados no ocupan horario.
Una operación puede empezar exactamente cuando termina otra: intervalos `[inicio, fin)`.
Las restricciones de exclusión y el bloqueo transaccional protegen también las solicitudes concurrentes.

Para finalizar un mantenimiento abierto:

```http
POST /api/mantenimientos/1/finalizar
Content-Type: application/json

{"fecha_fin":"2026-10-16T13:00:00"}
```

Devuelve el mantenimiento con su fecha final. No vuelve a consumir materiales ni cambia
sus detalles. Un mantenimiento ya finalizado o anulado devuelve 409.

## Registro de viajes y costos

La transacción registra viaje, tramos, entregas, remuneración y costos:

- `COMBUSTIBLE`: kilómetros del recorrido × consumo configurado × precio. Se guardan los
  tres valores aplicados y los galones estimados. Galones a seis decimales y dinero a dos,
  usando NUMERIC de PostgreSQL.
- `PEAJE`: suma de los importes históricos de cada tramo, incluidos ceros y pasos repetidos.
- `VIATICO`: una asignación por chofer y día con viajes válidos. Se divide entre sus viajes;
  los centavos restantes se asignan en orden de id_viaje para mantener el total diario exacto.
- `CHOFER`: distribución de la remuneración diaria existente.

La fecha del viaje determina las vigencias. Si falta combustible, viático o peaje, la API
devuelve 409 y revierte todo el registro; no asume un costo cero ni crea configuraciones.
Los costos se consultan en `GET /api/viajes/:id`. Registrar otro viaje redistribuye las
asignaciones diarias: volver a consultar los viajes anteriores para ver su valor actualizado.

Al anular, se conservan combustible y peajes como estimaciones históricas del viaje anulado.
Los informes vigentes deben excluir viajes ANULADOS. Se eliminan sus asignaciones de chofer
y viático y se redistribuyen entre los restantes. Sin viajes, el viático diario queda en cero;
la remuneración conserva las reglas del chofer fijo. Ninguna de estas operaciones registra
pagos ni gastos reales. Las remuneraciones no tienen cierre propio; el cierre operativo del día está pendiente.

## Pruebas

`npm test` ejecuta la suite. `node --test test/costos-horarios.test.js` verifica CRUD,
vigencias, protección histórica, ausencia de configuración con rollback, decimales,
distribución diaria, anulaciones, finalización y registros concurrentes.
