# Informes económicos y consumo de combustible

Consultas de solo lectura. No crean gastos, remuneraciones ni costos, ni cambian configuraciones. Usan los valores históricos guardados en detalles y costos de viaje. No requieren modificar el esquema.

## Rutas y filtros

| Ruta GET | Contenido | Filtro opcional |
| --- | --- | --- |
| `/api/informes/viajes` | Ingreso, estimaciones, margen estimado y peajes reales por viaje | `id_vehiculo` |
| `/api/informes/resumen-economico` | Totales y conceptos del período completo | `id_vehiculo` |
| `/api/informes/viaticos` | Viático estimado y gastos asociados por chofer y día | `id_chofer` |
| `/api/informes/consumo-combustible` | Intervalos entre cargas completas por vehículo | `id_vehiculo` |

Todas requieren `fecha_desde` y `fecha_hasta` con formato `YYYY-MM-DD`, inclusivas, para un máximo de 366 días. Los listados admiten `limit` (1–200, por defecto 50) y `offset` (por defecto 0). Cada fila incluye `total_registros` antes de paginar; una página vacía devuelve `[]`. El resumen siempre abarca todo el período aunque se envíe paginación. Se rechazan filtros no admitidos.

```text
GET /api/informes/viajes?fecha_desde=2026-10-01&fecha_hasta=2026-10-31&id_vehiculo=1
GET /api/informes/resumen-economico?fecha_desde=2026-10-01&fecha_hasta=2026-10-31
GET /api/informes/viaticos?fecha_desde=2026-10-01&fecha_hasta=2026-10-31&id_chofer=1
GET /api/informes/consumo-combustible?fecha_desde=2026-10-01&fecha_hasta=2026-10-31&id_vehiculo=1
```

Los decimales se devuelven como texto; los cálculos se hacen con `NUMERIC` en PostgreSQL. Fechas y horas corresponden a la hora local guardada. Un filtro por identificador sin datos devuelve una lista vacía o totales sin operaciones.

## Informe por viaje

Incluye únicamente viajes `REGISTRADO`, por fecha de inicio:

- `ingreso_transporte`: suma de `detalle_viaje.valor_transporte`; es el ingreso del servicio, no un cobro recibido.
- `costo_estimado_total`: suma de los costos históricos del viaje; se muestran también combustible, chofer, viático y peaje.
- `margen_estimado`: ingreso menos costos estimados.
- `gastos_directos_registrados`: gastos válidos vinculados explícitamente al viaje, incluso si se registraron después del período consultado.
- `peaje_real_registrado`, `diferencia_peaje` y porcentaje: suma de gastos `PEAJE` del viaje frente a su estimación. Una diferencia positiva indica más gasto registrado que estimado.

Sin gastos de peaje, el importe real y la diferencia son `null`, con estado `SIN_GASTOS_REGISTRADOS`: la ausencia de un registro no demuestra que el costo fue cero. Con gastos se indica `COMPARACION_PARCIAL`, porque aún no existe un cierre que certifique que se ingresaron todos los comprobantes. Si el estimado es cero, se puede mostrar la diferencia monetaria, pero el porcentaje es `null`.

`margen_real` permanece `null`. No sería correcto restar únicamente los comprobantes existentes y llamarlo utilidad real: faltan los pagos de choferes y la atribución de combustible consumido a cada viaje. Una carga de combustible puede utilizarse en varios viajes. Los viáticos diarios se comparan en su propio informe, sin repartir arbitrariamente los gastos reales.

## Resumen económico

Agrupa ingresos y costos de viajes válidos por fecha de inicio, y gastos válidos por **fecha del desembolso**. Por eso `diferencia_desembolso_estimado`, desglosada por concepto, es una diferencia de registro entre esos dos conjuntos, no una prueba de sobreconsumo ni de rentabilidad real.

Devuelve cantidad de viajes, ingreso, costo y margen estimados, gastos registrados y los siguientes subconjuntos:

- `gastos_sin_viaje`: gastos sin asignación a un viaje, incluidos abastecimientos y viáticos diarios.
- `gastos_sin_vehiculo`: gastos generales sin vehículo.
- `gastos_de_viajes_anulados`: gastos todavía válidos cuyo viaje se anuló. Anular un viaje no revierte un desembolso real.

Estos subconjuntos pueden solaparse; **no se suman entre sí** para obtener el total. Un gasto aparece una sola vez en el total y en su concepto. El importe de una carga se toma de `GASTO`, sin volver a sumarlo desde `ABASTECIMIENTO_COMBUSTIBLE`.

`remuneracion_generada_sin_viajes` muestra la remuneración diaria registrada que no está asignada a viajes válidos. Solo se informa en el resumen general: con filtro de vehículo devuelve `null`, porque no corresponde atribuir esos días a un vehículo. No genera días faltantes y no incluye remuneraciones que aún no se hayan generado. Los pagos de nómina no forman parte del módulo.

Los conceptos sin gasto registrado o sin estimación conservan `null` en ese lado; no se inventa una comparación. Los tipos manuales son texto normalizado: use `PEAJE` y `VIATICO` de forma consistente; `COMIDA` se considera un concepto distinto.

## Viáticos por día

Selecciona por fecha del `VIATICO_CHOFER` y suma sus gastos válidos asociados mediante `id_viatico_chofer`, independientemente de cuándo se pagaron. Varios comprobantes del mismo día se suman una sola vez. El estimado diario tampoco se multiplica por la cantidad de viajes.

Ejemplo: estimado 12.00, dos comprobantes de 6.00 y 8.00 → real registrado 14.00, diferencia 2.00. Si se anulan todos los viajes del día y el estimado queda en cero, el gasto real permanece y el porcentaje no se calcula. Un gasto genérico sin `id_viatico_chofer` aparece en el resumen, pero no se asigna por suposición a un chofer.

## Consumo entre cargas completas

Se construyen intervalos entre dos abastecimientos válidos con `tanque_lleno=true` del mismo vehículo. Se incluye un intervalo si su carga de cierre está dentro del período consultado; la carga inicial puede estar fuera del período. El filtro de fechas se aplica **después** de buscar esa carga inicial.

```text
Carga inicial completa: odómetro 1.000, 50 galones
Carga parcial:          odómetro 1.050,  4 galones
Carga final completa:   odómetro 1.100,  8 galones

Distancia:              1.100 - 1.000 = 100 km
Consumo observado:      4 + 8 = 12 galones
Consumo por kilómetro:  12 / 100 = 0,12 galones/km
```

Los 50 galones de la carga inicial se excluyen: reponen combustible consumido antes del intervalo. Se suman todas las cargas posteriores, incluidas las parciales y la carga completa final. `importe_comprado_intervalo` es el desembolso por esas cargas, no una valoración exacta del combustible consumido, porque puede haber combustible comprado a otro precio en el tanque.

Para comparar se toman los viajes válidos enteramente comprendidos entre ambas cargas y sus snapshots de combustible:

```text
consumo_referencia = suma(galones_estimados) / suma(kilometros_aplicados)
galones_referencia_odometro = consumo_referencia × distancia del odómetro
desviacion_porcentaje = (consumo_real / consumo_referencia - 1) × 100
```

Es una referencia ponderada de los viajes registrados, aplicada a la distancia real del odómetro. No usa configuraciones actuales ni cambia estimaciones históricas. Si el consumo de referencia es 0,10 galones/km en el ejemplo, se esperan 10 galones y la desviación es +20 %. `supera_referencia=true` señala que supera esa referencia; no demuestra una avería ni determina su causa.

Se muestran kilómetros del odómetro, kilómetros de viajes y su diferencia para revisar recorridos faltantes o distancias configuradas inexactas. `galones_estimados_viajes` conserva la estimación original de los recorridos, que puede diferir de `galones_referencia_odometro`.

Estados:

| Estado | Interpretación |
| --- | --- |
| `COMPARABLE` | Existe intervalo válido y referencia de viajes completos |
| `SIN_CARGA_INICIAL` | Primera carga completa conocida; no permite medir consumo previo |
| `ODOMETRO_SIN_AVANCE` | La distancia no es positiva; no se divide entre cero |
| `VIAJES_CRUZAN_LIMITES` | Un viaje cruza el inicio o fin; se muestra consumo observado pero no desviación contra un recorrido parcial |
| `SIN_REFERENCIA_VIAJES` | No hay viajes completos con estimaciones suficientes; puede existir consumo observado sin referencia |

Las cargas parciales posteriores a la última carga completa quedan pendientes de un cierre y no generan un intervalo propio. Se pueden consultar en `/api/abastecimientos-combustible`. Las cargas anuladas se excluyen; al anular un cierre, el siguiente intervalo se reconstruye a partir de la carga completa válida anterior. También se excluyen los viajes anulados.

El método presupone que todas las cargas fueron registradas, las lecturas son correctas y `tanque_lleno` representa un llenado completo comparable. No añade umbrales automáticos de alerta ni altera el kilometraje de mantenimiento.

## Verificación

`test/informes.test.js` comprueba las consultas HTTP con PostgreSQL aislado: agregaciones con varios detalles y gastos, sumas históricas, ausencia de datos, viáticos diarios, paginación, períodos, cargas parciales, cierres fuera del inicio del filtro, anulaciones, odómetro sin avance y viajes que cruzan los límites. No modifica la base de trabajo.
