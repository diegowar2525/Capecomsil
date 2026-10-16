// Genera únicamente el bloque de trayectos del seed desde la respuesta guardada.
// No consulta servicios externos ni ejecuta SQL contra una base de datos.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const database = path.resolve(__dirname, "../../database");
const ubicaciones = JSON.parse(fs.readFileSync(path.join(database, "data/ubicaciones_gasolineras.json"), "utf8"));
const captura = JSON.parse(fs.readFileSync(path.join(database, "data/distancias_gasolineras_osrm.json"), "utf8"));
const puntos = ubicaciones.ubicadas;
const respuesta = captura.respuesta;
assert.equal(respuesta.code, "Ok");
assert.deepEqual(captura.estaciones, puntos.map(p => p.nombre));
assert.equal(new Set(captura.estaciones).size, puntos.length);
assert.equal(respuesta.distances.length, puntos.length);
assert.equal(respuesta.sources.length, puntos.length);
assert.equal(respuesta.destinations.length, puntos.length);
for (const punto of [...respuesta.sources, ...respuesta.destinations]) {
    assert.ok(Number.isFinite(punto.distance) && punto.distance <= 300, "Revisar punto alejado más de 300 m de la vía");
}
const quote = value => "'" + value.replaceAll("'", "''") + "'";
const filas = [];
for (let origen = 0; origen < puntos.length; origen++) {
    assert.equal(respuesta.distances[origen].length, puntos.length);
    for (let destino = 0; destino < puntos.length; destino++) {
        if (origen === destino) continue;
        const metros = respuesta.distances[origen][destino];
        assert.ok(Number.isFinite(metros) && metros > 0, "Ruta ausente o distancia no positiva");
        // Aproximación a 100 m; mínimo 100 m para no convertir un trayecto corto en cero.
        const km = Math.max(0.1, Math.round(metros / 100) / 10).toFixed(2);
        filas.push(`    (${quote(puntos[origen].nombre)}, ${quote(puntos[destino].nombre)}, ${km})`);
    }
}
const inicio = "-- INICIO TRAYECTOS ENTRE GASOLINERAS (generado)";
const fin = "-- FIN TRAYECTOS ENTRE GASOLINERAS (generado)";
const bloque = `${inicio}
-- Fuente y coordenadas: data/ubicaciones_gasolineras.json.
-- Respuesta de rutas: data/distancias_gasolineras_osrm.json (${captura.fecha_consulta}).
-- OSRM driving / OpenStreetMap: distancia de ruta por carretera en cada sentido.
-- Aproximaciones de desarrollo; no validan restricciones de tanqueros ni mercancías peligrosas.
-- ${puntos.length} estaciones ubicadas, ${filas.length} trayectos; ${ubicaciones.pendientes.length} estaciones pendientes de ubicación.
INSERT INTO trayecto (nombre,id_gasolinera_origen,id_gasolinera_destino,kilometros,observacion)
SELECT origen.nombre || ' → ' || destino.nombre,origen.id_gasolinera,destino.id_gasolinera,r.kilometros,
    'ESTIMACIÓN DE PRUEBA: OSRM driving/OpenStreetMap ${captura.fecha_consulta}; carretera por sentido, redondeada a 0,1 km. No valida acceso de tanqueros. Fuentes: database/data/ubicaciones_gasolineras.json.'
FROM (VALUES
${filas.join(",\n")}
) AS r(origen,destino,kilometros)
JOIN gasolinera origen ON origen.nombre=r.origen
JOIN gasolinera destino ON destino.nombre=r.destino;
${fin}
`;
const archivo = path.join(database, "seed.sql");
let seed = fs.readFileSync(archivo, "utf8");
const desde = seed.indexOf(inicio);
if (desde !== -1) {
    const hasta = seed.indexOf(fin, desde);
    assert.ok(hasta > desde, "Bloque de seed incompleto");
    seed = seed.slice(0, desde) + bloque + seed.slice(hasta + fin.length).replace(/^\r?\n/, "");
} else {
    const posicion = seed.lastIndexOf("COMMIT;");
    assert.ok(posicion > 0, "Falta COMMIT en el seed");
    seed = seed.slice(0, posicion) + bloque + seed.slice(posicion);
}
fs.writeFileSync(archivo, seed);
console.log(`${filas.length} trayectos generados para ${puntos.length} estaciones; ${ubicaciones.pendientes.length} pendientes.`);
