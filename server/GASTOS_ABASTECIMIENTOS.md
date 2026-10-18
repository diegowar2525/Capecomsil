# Gastos reales y abastecimientos de combustible

Este módulo usa las tablas `gasto` y `abastecimiento_combustible` del esquema consolidado. No requiere nuevas tablas ni atributos para esta etapa. La base de trabajo debe tener aplicada la versión actual del esquema; no ejecute el archivo completo sobre una base con datos.

Los importes reales se registran aquí. `COSTO_VIAJE` mantiene las estimaciones: registrar un gasto no las reemplaza. Las comparaciones ya están disponibles en `/api/informes/viajes`, `/api/informes/resumen-economico`, `/api/informes/viaticos` y `/api/informes/consumo-combustible`. Consultar [INFORMES.md](INFORMES.md) para filtros y límites de interpretación de los resultados.

## Endpoints

| Método | Ruta | Operación |
| --- | --- | --- |
| GET | `/api/gastos` | Listar gastos |
| GET | `/api/gastos/:id` | Consultar gasto y su posible abastecimiento |
| POST | `/api/gastos` | Registrar gasto manual |
| POST | `/api/gastos/:id/anular` | Anular gasto |
| GET | `/api/abastecimientos-combustible` | Listar cargas con importe y estado del gasto |
| GET | `/api/abastecimientos-combustible/:id` | Consultar carga |
| POST | `/api/abastecimientos-combustible` | Registrar carga y generar gasto |
| POST | `/api/abastecimientos-combustible/:id/anular` | Anular carga mediante su gasto |

Se conservan los registros originales. Para corregir una operación, anúlela con motivo y registre la correcta; no hay edición ni eliminación física.

## Gasto manual

```json
{
  "fecha": "2026-10-17",
  "tipo_gasto": "PEAJE",
  "monto": "5.00",
  "id_viaje": 1,
  "id_vehiculo": null,
  "id_proveedor": null,
  "descripcion": "Peaje del recorrido",
  "numero_comprobante": "PE-001",
  "observacion": null
}
```

Los identificadores del ejemplo deben existir. Si se indica un viaje, se toma su vehículo automáticamente; un vehículo explícito distinto se rechaza. No se agregan gastos a viajes anulados. Se permiten gastos generales sin vehículo ni viaje, por ejemplo comida, usando el concepto correspondiente en `tipo_gasto`. El tipo se normaliza a mayúsculas y el monto debe ser positivo.

Para asociar comida al viático diario estimado del chofer, use `tipo_gasto: "VIATICO"`, `id_viatico_chofer` y omita `id_viaje`. Pueden existir varios comprobantes del mismo día; sus importes no se limitan a la estimación. La fecha del gasto representa la fecha del desembolso y puede diferir de la operación relacionada.

Anular un viaje no anula automáticamente un desembolso real ya registrado. Si ese gasto también era un error, anúlelo expresamente. Lo mismo aplica si el viático estimado cambia al anular viajes.

## Abastecimiento

```json
{
  "id_vehiculo": 1,
  "id_proveedor": null,
  "fecha_hora": "2026-10-17T07:30:00",
  "kilometraje_odometro": "125800.00",
  "galones": "20.0000",
  "precio_por_galon": "3.1030",
  "tanque_lleno": true,
  "numero_comprobante": "COM-001",
  "observacion": "Carga completa antes de salir"
}
```

El precio es el precio real pagado por galón. PostgreSQL calcula `round(galones * precio_por_galon, 2)` con aritmética decimal; en el ejemplo el gasto es **62.06**. No se envían `monto` ni `id_gasto`: los genera el backend. El gasto se registra como `COMBUSTIBLE`, con el mismo vehículo, proveedor, comprobante y fecha local de la carga. No se permite crear un gasto manual `COMBUSTIBLE`; se usa este flujo para conservar también los datos de consumo.

Carga y gasto se guardan juntos en una transacción. Si falla cualquiera, no queda guardado ninguno. La respuesta contiene `id_gasto`, `id_abastecimiento_combustible`, `monto` y los datos de la carga. Al consultar gastos, ese importe aparece una sola vez.

El combustible abastecido puede utilizarse en varios viajes, por eso no se le asigna un viaje arbitrariamente. Las cargas no alteran el inventario de repuestos ni el kilometraje estimado de los planes de mantenimiento.

`tanque_lleno` debe ser booleano. La lectura del odómetro debe ser no negativa y coherente con todas las cargas válidas anteriores y posteriores del mismo vehículo. Se permiten lecturas iguales en horas distintas, pero no dos cargas válidas para el mismo vehículo y fecha/hora. Las cargas anuladas no participan en esta validación. Un reemplazo de odómetro requerirá un tratamiento específico futuro; no debe registrarse como una lectura menor sin explicación en el modelo.

Las fechas y horas representan hora local de Ecuador, sin sufijo de zona horaria. Los importes y cantidades decimales se devuelven como texto para conservar precisión.

## Anulación

```json
{ "motivo": "Comprobante registrado por error" }
```

Anular un abastecimiento cambia el estado de su gasto a `ANULADO`, con fecha y motivo. El estado del abastecimiento se obtiene de ese mismo gasto: no hay dos estados que puedan divergir. También puede anularse desde `/gastos/:id/anular`; el abastecimiento aparecerá anulado. Una segunda anulación devuelve 409, incluso ante peticiones simultáneas. Los datos originales permanecen consultables.

## Consultas

Ambos listados admiten `id_vehiculo`, `id_proveedor`, `fecha_desde`, `fecha_hasta`, `estado`, `limit` (1–200, por defecto 50) y `offset` (por defecto 0). Sin filtro de estado, incluyen registrados y anulados. Las fechas son inclusivas. Ordenan por fecha descendente y luego por identificador.

Gastos también admite `id_viaje`, `id_viatico_chofer` y `tipo_gasto`.

```text
GET /api/gastos?tipo_gasto=PEAJE&id_viaje=1&estado=REGISTRADO
GET /api/gastos?id_viatico_chofer=1&estado=REGISTRADO
GET /api/abastecimientos-combustible?id_vehiculo=1&fecha_desde=2026-10-01&fecha_hasta=2026-10-31&estado=REGISTRADO
```

Las pruebas `test/gastos-abastecimientos.test.js` verifican precisión decimal, referencias, rollback cuando falla la carga después de insertar el gasto, orden del odómetro, altas concurrentes y anulaciones desde ambos módulos en un esquema PostgreSQL aislado.
