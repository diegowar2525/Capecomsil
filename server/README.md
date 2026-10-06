# API de CAPECOMSIL

## Recepciones posteriores de compras

`POST /api/recepciones-compra` registra una entrega de una factura existente:

```json
{
  "id_factura_proveedor": 1,
  "fecha_recepcion": "2026-10-05",
  "numero_comprobante": "ENTREGA-002",
  "observacion": "Entrega parcial",
  "detalles": [
    {
      "id_detalle_factura_proveedor": 1,
      "cantidad_recibida": "3.00",
      "observacion": null
    }
  ]
}
```

Se utilizan los IDs reales de los detalles obtenidos al consultar la factura,
no posiciones ni IDs de producto. Comprobante y observaciones son opcionales.
La respuesta 201 incluye la recepción y sus detalles; las entradas se generan
automáticamente, una por detalle, en la misma transacción.

La factura debe existir y no estar ANULADA. PAGADA no impide recibir productos.
Se rechazan servicios, detalles ajenos o repetidos, cantidades no positivas y
cantidades superiores a lo pendiente. Lo pendiente resta únicamente recepciones
REGISTRADAS. La comprobación usa NUMERIC y bloquea la factura y los productos
durante la transacción para evitar excesos en entregas simultáneas.

La recepción inicial comparte el mismo servicio transaccional y conserva el
formato `numero_detalle` de la petición de factura. Este módulo no incluye
anulaciones: cambiar un estado directamente en SQL no revierte inventario.
No requiere cambios de esquema ni borrar datos. Las consultas de stock,
ajustes y anulaciones se implementarán por separado.

## Mantenimientos

Disponible: `POST /api/mantenimientos`, `GET /api/mantenimientos` y
`GET /api/mantenimientos/:id`. Cada entidad tiene su propio modelo; el servicio
coordina cabecera, detalles y salidas en una sola transacción. No se incluyen
edición, eliminación ni anulación de mantenimientos en esta primera versión.

```json
{
  "id_vehiculo": 1,
  "id_proveedor": null,
  "fecha": "2026-10-05",
  "tipo": "Cambio de filtros",
  "monto": "25.00",
  "descripcion": "Mantenimiento del motor",
  "observacion": null,
  "detalles": [
    { "id_producto": 1, "cantidad": "2.00", "observacion": null }
  ]
}
```

Vehículo, fecha, tipo y monto son obligatorios. El proveedor es opcional.
El monto es el importe registrado para el trabajo, no se calcula a partir de
productos ni genera automáticamente gastos, facturas o pagos. Se admite cero.
Se pueden omitir los detalles o enviar una lista vacía si no se consume inventario.
Cada producto aparece una vez; las cantidades son positivas y admiten dos decimales.
Se comprueban referencias y stock actual, incluyendo ajustes con signo.
El stock se compara en PostgreSQL usando NUMERIC. Se bloquean los productos
en orden por ID hasta terminar la transacción para impedir consumos simultáneos
por encima de las existencias. Un fallo revierte toda la operación.

Para probar consumos después de limpiar la base: cargar catálogos con `seed.sql`
y registrar una compra con recepción inicial para disponer de stock. El seed no
carga existencias. El rechazo por stock insuficiente devuelve HTTP 409.

`factura_proveedor.detalle` (texto de cabecera) se eliminó del esquema.
Las líneas de `detalle_factura_proveedor` permanecen.

## Facturas de proveedor: productos, servicios e impuestos

Las escrituras están separadas por entidad en los modelos de factura, detalle de
factura, recepción, detalle de recepción y movimiento de inventario. El servicio
de facturas coordina esos modelos con el mismo `client` dentro de una transacción.
Los detalles no tienen un CRUD independiente: se registran como parte de la compra.

Rutas disponibles: `POST /api/facturas-proveedor`, `GET /api/facturas-proveedor`
y `GET /api/facturas-proveedor/:id`. No hay edición ni eliminación de facturas en
este módulo inicial. La API calcula los importes; ignora totales enviados por el cliente.

Para una base nueva, usar solamente `database/schema.sql`. Para actualizar la versión
anterior, ejecutar una sola vez `database/migrations/004_factura_proveedor_conceptos.sql`.
Esta migración cambia `monto_total` a `total` y aborta si hay facturas existentes:
no deduce impuestos históricos de importes que no los desglosan.

```json
{
  "id_proveedor": 1,
  "numero_factura": "001-001-000000001",
  "fecha_emision": "2026-09-28",
  "fecha_vencimiento": "2026-10-28",
  "detalles": [
    {
      "tipo_concepto": "PRODUCTO",
      "id_producto": 1,
      "descripcion": "Llantas",
      "cantidad": "10.00",
      "precio_unitario": "20.00",
      "descuento": "10.00",
      "porcentaje_impuesto": "12.0000"
    },
    {
      "tipo_concepto": "SERVICIO",
      "descripcion": "Reparación",
      "cantidad": "1.00",
      "precio_unitario": "30.00",
      "porcentaje_impuesto": "0"
    }
  ],
  "recepcion_inicial": {
    "fecha_recepcion": "2026-09-28",
    "detalles": [{ "numero_detalle": 1, "cantidad_recibida": "4.00" }]
  }
}
```

Las tasas del ejemplo son ilustrativas, no valores predeterminados. Cada línea debe
enviar su porcentaje (0 a 100, máximo cuatro decimales); el descuento omitido es cero
y representa un importe por línea, no un porcentaje. Cantidad y precio admiten dos
decimales. Los valores calculados se almacenan y se devuelven como texto decimal.
PostgreSQL NUMERIC redondea el bruto por línea a dos decimales, resta el descuento
y redondea su impuesto a dos decimales (mitades hacia arriba para importes positivos).
La cabecera suma esos valores almacenados; no vuelve a descontar `descuento_total`.
El ejemplo produce subtotal 220.00, descuento_total 10.00, impuestos 22.80 y total 242.80.

`recepcion_inicial` es opcional. `numero_detalle` identifica la posición de la línea
en la petición, empezando en 1. Solo admite productos y cantidades positivas que no
superen lo facturado. La factura del ejemplo registra 10 llantas pero solo entran 4.
Sin recepción inicial no se crean movimientos. Factura, detalles, recepción y entradas
se guardan usando una única conexión y transacción; cualquier fallo revierte todo.
Las recepciones posteriores usan el servicio descrito arriba. Pagos y anulaciones
siguen pendientes.

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
