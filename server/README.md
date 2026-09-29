# API de CAPECOMSIL

## Inicialización de PostgreSQL

Ejecutar únicamente `database/schema.sql` en una base vacía. Incluye las 22 tablas,
restricciones, funciones, triggers y la extensión `btree_gist`; no requiere migraciones
adicionales. Se necesitan permisos para crear esos objetos. El archivo no borra datos
ni está diseñado para ejecutarse repetidamente sobre tablas existentes.
En psql puede ejecutarse de forma atómica con `psql -1 -v ON_ERROR_STOP=1 -d capecomsildb -f database/schema.sql`.

Los estados administrativos de los nueve catálogos se reciben, almacenan y devuelven
como booleanos, con true por defecto. La interfaz puede mostrarlos como Activo/Inactivo.
Los estados de procesos (viajes, liquidaciones y facturas) conservan sus valores de texto.

## Gastos y ajustes de inventario

El esquema permite gastos sin vehículo y ajustes
de inventario con signo. ENTRADA y SALIDA reciben cantidades positivas;
AJUSTE recibe la diferencia positiva o negativa, nunca cero, no el saldo final.
El saldo se calcula sumando ENTRADA y AJUSTE y restando SALIDA.
El futuro servicio de inventario deberá bloquear el producto y comprobar el
saldo dentro de la misma transacción para impedir existencias negativas.
La restricción del esquema valida el signo, no el saldo acumulado.

`gasolinera.agente_retencion` se recibe y almacena como booleano; la interfaz
podrá mostrar Sí o No. Su valor predeterminado es false.

## Choferes

`tipo_remuneracion` es obligatorio y admite únicamente SUELDO o POR_VIAJE.
La API recorta espacios y convierte el texto a mayúsculas. PostgreSQL refuerza
la regla con NOT NULL y `chk_chofer_tipo_remuneracion`. No existe un valor
predeterminado: se debe seleccionar explícitamente el tipo de remuneración.

## Productos

Las reglas de productos están incluidas en `database/schema.sql`.

Rutas: `GET /api/productos`, `GET /api/productos/:id`, `POST /api/productos`,
`PUT /api/productos/:id` y `DELETE /api/productos/:id`.
Los GET incluyen `nombre_categoria` además de `id_categoria`.

Cuerpo de ejemplo para crear o reemplazar un producto:

```json
{
  "id_categoria": 1,
  "nombre": "Filtro de aceite",
  "medida": null,
  "modelo": null,
  "marca": null,
  "descripcion": null,
  "unidad_medida": "unidad",
  "stock_minimo": 2,
  "estado": true
}
```

Nombre, categoría y unidad son obligatorios. Los textos se recortan; los opcionales
vacíos se almacenan como null. La unidad se normaliza a minúsculas y sigue siendo
texto libre hasta definir un catálogo (no se unifican sinónimos). El stock mínimo
admite hasta dos decimales, no es negativo y se omite para usar cero. Como otros
NUMERIC de PostgreSQL, se devuelve en texto. El estado se recibe como booleano,
usa true por defecto y se almacena y devuelve como true o false.

La categoría debe existir y estar activa al crear o cambiar de categoría. Es posible
editar o inactivar un producto que conserva una categoría posteriormente inactivada.
Se permiten nombres repetidos. PUT reemplaza los campos editables; omitir los
opcionales aplica sus valores predeterminados.

Compras, movimientos o mantenimientos asociados impiden eliminar el producto o
cambiar su unidad. Se permite inactivarlo y modificar el resto de sus datos.
Estas reglas se comprueban en servicios y se respaldan con triggers y claves
foráneas en PostgreSQL. El CRUD no modifica existencias ni crea movimientos.
`fecha_creacion` la genera PostgreSQL y no se modifica mediante la API.

Las pruebas de productos ejecutan solicitudes HTTP contra un esquema temporal
de PostgreSQL y revierten sus datos al terminar.

Configurar `PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD` en `.env`.
Ejecutar `npm install` y `npm run dev` desde `server`.

## Tarifas

Las reglas de tarifas y la extensión `btree_gist` están incluidas en `database/schema.sql`.

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
igual que los otros CRUD. PostgreSQL y las respuestas conservan esos booleanos.
El estado es únicamente administrativo.
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
