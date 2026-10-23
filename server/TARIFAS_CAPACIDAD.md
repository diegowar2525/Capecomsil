# Tarifas por capacidad y modalidades históricas

Aplicar `database/migrations/024_tarifas_capacidad.sql` sobre una instalación actualizada hasta la migración 023. Para instalaciones nuevas, `database/schema.sql` ya incluye estos cambios. No ejecutar ambos sobre la misma base. La migración conserva los importes anteriores y asigna la modalidad POR_TERMINAL a las gasolineras existentes. También es la modalidad inicial de nuevas gasolineras.

## Cálculo de entregas

La fecha de inicio del viaje determina la modalidad vigente de cada gasolinera:

- `POR_TERMINAL`: tarifa por gasolinera y terminal de carga, como antes.
- `POR_CAPACIDAD`: tarifa por gasolinera y capacidad del vehículo (4000, 6000, 8000 o 10000 galones). El terminal y el recorrido no cambian el precio.

En ambos casos, `valor_transporte = round(galones entregados × valor_por_galon, 2)`. El terminal sigue siendo necesario para validar el recorrido. Un viaje puede mezclar gasolineras con modalidades diferentes. Las capacidades de vehículos en modalidad normal no quedan limitadas a estas cuatro.

Si no hay modalidad o tarifa vigente, se devuelve 409; en modalidad por capacidad el mensaje identifica gasolinera, capacidad y fecha. No se utiliza una tarifa normal como alternativa.

El cliente no envía precios ni identificadores de tarifas al crear o editar un viaje. El servidor selecciona la configuración. Las entregas conservan `id_modalidad_tarifa`, `id_gasolinera`, `id_terminal` y exactamente una referencia entre `id_tarifa` e `id_tarifa_capacidad`, además del precio aplicado. La edición del viaje vuelve a calcular según sus datos; las restricciones de liquidaciones se mantienen.

## API de tarifas por capacidad

Rutas bajo `/api`, con sesión y protección CSRF en escrituras:

| Método | Ruta | Permiso |
| --- | --- | --- |
| GET | `/tarifas-capacidad` | `tarifas.consultar` |
| GET | `/tarifas-capacidad/:id` | `tarifas.consultar` |
| POST | `/tarifas-capacidad` | `tarifas.crear` |
| PUT | `/tarifas-capacidad/:id` | `tarifas.editar` |
| DELETE | `/tarifas-capacidad/:id` | `tarifas.eliminar` |

POST y PUT reciben el registro completo; creación devuelve 201, las demás operaciones 200:

```json
{
  "id_gasolinera": 1,
  "capacidad_galones": 8000,
  "valor_por_galon": "0.1500",
  "fecha_inicio": "2026-11-01",
  "fecha_fin": null,
  "estado": true
}
```

No admite terminal ni campos adicionales. Fin de vigencia es opcional y los extremos son inclusivos. No pueden solaparse tarifas activas para la misma gasolinera/capacidad. Los decimales se devuelven como texto.

Una tarifa utilizada no se elimina ni cambia de gasolinera, capacidad, precio o estado. Su vigencia puede ajustarse si sigue cubriendo todas las fechas de los viajes asociados. Para un nuevo precio, finalizar la vigencia anterior y crear una nueva desde el día siguiente. Configurar las cuatro tarifas antes de registrar viajes con esa modalidad.

## API de modalidades

- `GET /api/modalidades-tarifa`: historial; filtro opcional `?id_gasolinera=1`. Permiso `tarifas.consultar`.
- `POST /api/modalidades-tarifa`: cambio de modalidad, permiso `tarifas.editar`, devuelve 201.

```json
{
  "id_gasolinera": 1,
  "modalidad": "POR_CAPACIDAD",
  "fecha_inicio": "2026-11-01"
}
```

El usuario elige la fecha efectiva; `fecha_creacion` registra automáticamente cuándo se creó el cambio. En una transacción, el período que contiene esa fecha termina el día anterior y se crea el nuevo, conservando el siguiente cambio programado si existe. No admite la misma modalidad ya vigente ni otro cambio en la misma fecha de inicio. Rechaza cambios que excluyan viajes vinculados, incluidos los anulados.

No hay PUT ni DELETE del historial: el cambio se expresa con un nuevo período. Las restricciones y bloqueos también protegen ante concurrencia. Los roles predefinidos permiten consultar a jefe y operador; las escrituras corresponden al jefe.

## Plantillas del frontend

Configuración incluye Tarifas por terminal, Tarifas por capacidad y Modalidades de tarifa. Gasolineras tiene modales de historial y cambio de modalidad. Siguen el catálogo y los formularios existentes, con guardado deshabilitado hasta conectar estas pantallas con la API. Al conectarlas, cargar el historial mediante su GET filtrado y enviar el ID de la gasolinera seleccionada al cambiar modalidad.
