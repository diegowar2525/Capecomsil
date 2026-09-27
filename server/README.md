# API de CAPECOMSIL

Configurar `PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD` en `.env`.
Ejecutar `npm install` y `npm run dev` desde `server`.

## Tarifas

Antes de usar las rutas, ejecutar una sola vez `database/migrations/001_tarifa_reglas.sql`
sobre la base configurada. Para una base nueva, crear primero `database/schema.sql`.
La migración requiere permiso para instalar `btree_gist` y crear restricciones y triggers.
Si hay períodos superpuestos, falla y revierte todos sus cambios; los datos deben revisarse.

| Método | Ruta | Operación |
| --- | --- | --- |
| GET | `/api/tarifas` | Listar |
| GET | `/api/tarifas/:id` | Consultar |
| POST | `/api/tarifas` | Crear |
| PUT | `/api/tarifas/:id` | Reemplazar datos |
| DELETE | `/api/tarifas/:id` | Eliminar si no tiene viajes |

Ejemplo de cuerpo para POST y PUT:

```json
{
  "id_gasolinera": 1,
  "id_terminal": 1,
  "valor_por_galon": "0.0350",
  "fecha_inicio": "2026-01-01",
  "fecha_fin": "2026-08-31",
  "estado": true
}
```

Las fechas son inclusivas y usan `YYYY-MM-DD`. `fecha_fin: null` significa sin límite.
En PUT se envían todos los campos; omitir fecha_fin la deja sin límite y omitir estado
lo establece en true. En las solicitudes, estado acepta únicamente true o false (sin comillas),
igual que los otros CRUD. El validador los convierte a ACTIVO e INACTIVO para la columna de texto
de PostgreSQL; las respuestas conservan esos valores de texto. El estado es únicamente administrativo.
Ningún estado permite solapamientos para la misma gasolinera y terminal.
El precio admite cero y hasta cuatro decimales; se devuelve como texto para conservar precisión.

Una tarifa utilizada no admite cambios de precio, gasolinera o terminal ni eliminación.
Se pueden modificar sus fechas solo si siguen incluyendo todos sus viajes, y cambiar su estado.
Para cambiar el precio, cerrar la tarifa anterior y crear otra con vigencia posterior.
PostgreSQL aplica estas reglas también a escrituras directas y serializa la asignación de
viajes con las modificaciones de tarifas. La fecha del viaje se compara por su día calendario
(`viaje.fecha` es timestamp sin zona horaria).

Respuestas: 400 para datos o referencias inválidos, 404 si no existe la tarifa y 409
para solapamientos o cambios que afectan al historial.
La futura implementación de viajes debe copiar el precio a `detalle_viaje.tarifa_aplicada`
al registrar el detalle; este CRUD no recalcula detalles históricos.

## Pruebas

`npm test` ejecuta validadores, rutas HTTP y reglas reales de PostgreSQL.
La prueba de integración usa la conexión de `.env`, crea un esquema aislado dentro de una
transacción y revierte todos los datos y objetos al finalizar. Requiere permisos de creación.
