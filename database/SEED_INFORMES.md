# Escenario del seed para probar informes

`seed.sql` ahora carga los catálogos y este escenario sintético en una sola transacción. Sigue siendo un seed para una base vacía con el esquema actualizado: no se vuelve a ejecutar sobre una base con datos. No borra datos ni actualiza el esquema. Los registros operativos no proceden del Excel; llevan referencias `SEED-*` o descripciones de prueba donde la tabla lo permite.

Después de aplicar el esquema y el seed en tu base de pruebas, inicia el backend y consulta octubre de 2026. No hace falta registrar manualmente viajes ni gastos para obtener resultados.

## Operaciones incluidas

Vehículo **AAJ0810**, chofer **AREVALO**. Cada viaje recorre **Terminal La Troncal → CECILIA → Terminal La Troncal**, con 22 km del catálogo. Transporta diésel con la tarifa de prueba de 0,016 por galón. Todos están dentro de la capacidad del vehículo y sus horarios no se cruzan.

| Fecha y hora | Galones entregados | Estado | Ingreso | Costo estimado |
| --- | ---: | --- | ---: | ---: |
| 05/10/2026, 08:00–10:00 | 5.000 | REGISTRADO | 80,00 | 34,00 |
| 05/10/2026, 13:00–15:00 | 4.000 | REGISTRADO | 64,00 | 34,00 |
| 06/10/2026, 08:00–10:00 | 6.000 | REGISTRADO | 96,00 | 57,50 |
| 07/10/2026, 08:00–10:00 | 3.000 | ANULADO | Excluido | Excluido |

Los dos viajes del 05 comparten el sueldo diario (17,50 cada uno) y el viático (6,00 cada uno). El viaje del 06 asume 35,00 y 12,00. El combustible estimado es 10,50 por viaje. Los peajes estimados siguen en cero provisional: no se cambió el catálogo para simular un peaje real.

El chofer tiene remuneraciones generadas del 05 al 08 de octubre. Los días 07 y 08 no tienen viajes válidos: suman 70,00 sin asignar a viajes. Son días sintéticos de prueba; el seed no incorpora un calendario legal de feriados.

Gastos:

- Peaje del primer viaje: 3,00.
- Segundo viaje: sin comprobante de peaje, para comprobar que aparece `null`.
- Peaje del tercer viaje: 5,00.
- Gasto conservado del viaje anulado: 4,00.
- Comida del 05: 14,00, frente a 12,00 estimados.
- Comida del 06: no registrada, para comprobar el estado pendiente.
- Gasto general sin vehículo: 25,00.
- Peaje duplicado de 99,00: anulado y excluido de los totales.
- Tres gastos de combustible generados junto con sus cargas: 62,06 + 12,41 + 24,82 = 99,29.

No se agregan facturas, pagos, mantenimientos ni movimientos de inventario en este escenario.

## Resumen económico esperado

En Postman: **GET**, sin body.

```text
http://localhost:3000/api/informes/resumen-economico?fecha_desde=2026-10-01&fecha_hasta=2026-10-31
```

| Campo | Valor esperado |
| --- | ---: |
| `cantidad_viajes` | 3 |
| `ingreso_transporte` | 240.00 |
| `costo_estimado_viajes` | 125.50 |
| `margen_estimado_viajes` | 114.50 |
| `gastos_registrados_periodo` | 150.29 |
| `gastos_de_viajes_anulados` | 4.00 |
| `remuneracion_generada_sin_viajes` | 70.00 |
| `gastos_sin_vehiculo` | 39.00 |

Los 39,00 sin vehículo son 25,00 generales y 14,00 de viático diario: este último pertenece al chofer y no se asigna a un vehículo. Estos importes son subconjuntos del total, no importes para sumar otra vez. Las remuneraciones no son pagos registrados en `GASTO`.

## Viajes y viáticos

```text
http://localhost:3000/api/informes/viajes?fecha_desde=2026-10-01&fecha_hasta=2026-10-31
http://localhost:3000/api/informes/viaticos?fecha_desde=2026-10-01&fecha_hasta=2026-10-31
```

El informe de viajes devuelve tres filas. Los peajes reales son 3,00, `null` y 5,00. Como el estimado es cero, la diferencia monetaria se muestra y el porcentaje es `null`.

El informe de viáticos devuelve dos días: el 05 tiene diferencia de +2,00; el 06 tiene gasto real `null`, no cero.

## Consumo de combustible esperado

```text
http://localhost:3000/api/informes/consumo-combustible?fecha_desde=2026-10-01&fecha_hasta=2026-10-31
```

| Carga | Odómetro ficticio | Galones | Tanque lleno |
| --- | ---: | ---: | --- |
| 05/10, 06:00 | 1.000 | 20 | Sí |
| 05/10, 17:00 | 1.044 | 4 | No |
| 06/10, 18:00 | 1.066 | 8 | Sí |

El intervalo cerrado contiene los tres viajes válidos y devuelve:

- Distancia del odómetro y de los viajes: **66 km**.
- Galones consumidos: **12** (4 + 8; los 20 iniciales no se suman).
- Galones estimados de los viajes: **10,150800**.
- Consumo observado: **0,181818 galones/km**.
- Consumo de referencia: **0,153800 galones/km**.
- Desviación: **+18,22 %**, `supera_referencia: true`.
- Importe comprado dentro del intervalo: **37,23**.

La primera carga completa aparece además como `SIN_CARGA_INICIAL`; es el punto de partida, no un intervalo medible. Las lecturas del odómetro son independientes del contador relativo de mantenimiento, que acumula los 66 km de viajes válidos.

Las cifras indicadas corresponden al seed recién cargado. Si agregas, anulas o modificas datos mediante los flujos disponibles, los informes cambiarán. Los IDs se obtienen de las consultas; no se presupone que las secuencias empezaron en 1.
