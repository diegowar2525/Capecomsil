# Trayectos entre gasolineras del seed

Investigación y consulta: **16 de octubre de 2026**.

Se añadieron **182 trayectos dirigidos** entre las **14 estaciones con coordenadas identificadas**.
El seed suma 248 trayectos, incluidos los 66 previos entre terminal y gasolinera.
No están completas las 272 conexiones posibles entre las 17 estaciones: faltan 90 que involucran alguna de las tres pendientes.
No se sustituyeron ubicaciones desconocidas por centros de ciudades, oficinas administrativas o puntos con nombres parecidos.

## Ubicaciones utilizadas

Coordenadas WGS84 de puntos de las estaciones, no de centros urbanos. Los enlaces individuales y coordenadas completas
están en [data/ubicaciones_gasolineras.json](data/ubicaciones_gasolineras.json).

| Estación del seed | Fuente de ubicación |
|---|---|
| CECILIA | Directorio oficial Terpel, enlace de EDS Cecilia en La Troncal |
| BBHY SILVAN 1 | Directorio oficial Terpel, EDS Silvan 1, Babahoyo |
| BABA SILVAN 2 | Directorio oficial Terpel, EDS Silvan 2, Baba |
| 1PETRILLO | Directorio oficial Terpel, EDS Petrillo 1 |
| 2PETRILLO | Directorio oficial Terpel, EDS Petrillo 2 |
| 2JIPIJAPA | Directorio oficial Terpel, EDS Jipijapa 2, Cotopaxi y Olmedo |
| 3JIPIJAPA | Directorio oficial Terpel, EDS Jipijapa 3, vía Jipijapa-Guayaquil |
| MECHITA | OpenStreetMap nodo 3032423986, Gasolinera Mechita |
| RIO VERDE | OpenStreetMap nodo 3953713548, Rio Verde, El Triunfo |
| COCHANCAY | OpenStreetMap nodo 3874195140, Cochancay |
| RIRCAY | OpenStreetMap nodo 3032424025, Rircay, avenida 25 de Agosto |
| MA. DEL CISNE | OpenStreetMap nodo 9150373423, María del Cisne, El Triunfo |
| SAN JACINTO | Confirmación del usuario: GPJ4+MR3, Cochancay |
| ROCIO | Confirmación del usuario: 74W5+C4F, Av. Alberto Ochoa, Biblián |

Fuentes: [Terpel Ecuador](https://terpelecuador.com/a-nivel-nacional),
[OpenStreetMap](https://www.openstreetmap.org/copyright).
La ubicación de Río Verde también se contrastó con su dirección en el
[directorio de estaciones de El Triunfo](https://ecuapinoo.com/gasolinera/el-triunfo/estacion-de-servicio-rio-verde/).
Para SAN JACINTO y ROCIO se decodificó el centro del Plus Code confirmado por el usuario. ROCIO corresponde a Biblián, descartando la referencia homónima de La Troncal.
Las direcciones originales del Excel se conservan en gasolinera: algunas son domicilios administrativos o están repetidas.

## Método de distancia

- Consulta única al servicio público `https://router.project-osrm.org/table/v1/driving/`, con las catorce coordenadas y `annotations=distance`.
- Distancias en metros de las rutas calculadas por OSRM con cartografía OpenStreetMap. Son rutas del perfil driving, no distancias en línea recta ni garantía de la ruta más corta.
- Se guarda cada sentido por separado. No se fuerza igualdad entre ida y regreso ni se divide una distancia de ida/vuelta.
- Conversión a kilómetros y redondeo a 0,1 km; mínimo 0,1 km para trayectos positivos muy cortos.
- La respuesta original, el orden de estaciones, fecha, URL y puntos ajustados a la red vial quedan guardados en
  [data/distancias_gasolineras_osrm.json](data/distancias_gasolineras_osrm.json).
- El generador rechaza rutas inexistentes, distancias no positivas y puntos ajustados a más de 300 m de la vía.

Ejemplo: Cecilia → Mechita ≈ 1,4 km; Mechita → Cecilia ≈ 1,0 km. Las diferencias pueden deberse a sentidos de circulación y accesos representados en el mapa.

Son **estimaciones de desarrollo**. El perfil driving no verifica gálibos, pesos, permisos de mercancías peligrosas,
entradas de tanqueros, cierres ni el recorrido que efectivamente usa el cliente. Antes de utilizarlas para costos reales,
confirmar la ruta con el cliente y ajustar el catálogo. Los tramos de viajes existentes conservan su kilometraje histórico.

## Tres estaciones pendientes

| Estación | Dato necesario |
|---|---|
| KM. 48 | Confirmar su acceso y si es un establecimiento distinto de MA. DEL CISNE. El RUC del Excel figura como Lumar / E.S. KM48. |
| SANTA MARTHA | Confirmar si corresponde a E/S Flota Santa Martha en Bucay y su acceso exacto. |
| CADME CORP | Punto real donde se entrega combustible. La dirección fiscal de la constructora no acredita ese destino. |

Las referencias encontradas y motivos quedan en `ubicaciones_gasolineras.json`, sección `pendientes`.
Para completar estas conexiones se necesitan coordenadas o enlaces de mapa que identifiquen el destino.
No se crean filas con cero ni distancias inventadas para simular cobertura completa.

## Reproducibilidad y uso

```powershell
node server/scripts/generar-trayectos-gasolineras-seed.js
```

El comando regenera el bloque a partir de la captura guardada, sin red, sin cambiar el resto del seed y sin ejecutar SQL.
Tras confirmar nuevas estaciones, actualizar las ubicaciones y obtener una nueva matriz en el mismo orden antes de regenerar.

El `seed.sql` completo sigue siendo para **base vacía**. Esta actualización no se ha ejecutado en la base de trabajo.
No borrar datos ni volver a ejecutar el seed completo sobre una base que ya contiene catálogos.
`TRAMO_VIAJE` se sigue creando al registrar un viaje; este archivo añade únicamente `TRAYECTO`.
