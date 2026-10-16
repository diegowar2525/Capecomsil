BEGIN;
-- CAPECOMSIL: seed de desarrollo para una base VACÍA con schema.sql actualizado.
-- Fuente: ENERO -2026-new.xlsm. No ejecuta macros ni importa viajes/entregas.
-- Trayectos terminal/gasolinera: mitad de km ida/vuelta del Excel (pruebas).
-- Trayectos entre gasolineras: estimaciones OSRM; ver TRAYECTOS_GASOLINERAS.md.
-- Cédulas PENDIENTE-* son identificadores provisionales, no documentos reales.
-- Tarifas positivas del catálogo DATOS: período de prueba 01 enero–31 diciembre 2026.
-- Ese período NO acredita las fechas contractuales ni la vigencia actual.
-- Ver SEED_EXCEL.md para fuentes, omisiones y RUC compartidos.
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM terminal) OR EXISTS (SELECT 1 FROM gasolinera)
        OR EXISTS (SELECT 1 FROM vehiculo) OR EXISTS (SELECT 1 FROM chofer)
        OR EXISTS (SELECT 1 FROM proveedor) OR EXISTS (SELECT 1 FROM categoria_producto)
        OR EXISTS (SELECT 1 FROM producto_transportado) THEN
        RAISE EXCEPTION 'El seed requiere catálogos vacíos; no mezclar con datos existentes';
    END IF;
END $$;

-- Terminales: DATOS!G3:AK3. TRONCAL - P INCA se omite por origen ambiguo.

INSERT INTO terminal (nombre) VALUES
    ('Terminal La Troncal'),
    ('Terminal Pascuales'),
    ('Terminal Santo Domingo'),
    ('Terminal La Libertad'),
    ('Terminal Manta');

-- DATOS!B5:F21 y estaciones identificadas en reportes.
-- Razones sociales de C no se confunden con representantes legales personales.
-- RUC compartidos quedan NULL en todos los establecimientos afectados.

INSERT INTO gasolinera (nombre, ruc, direccion, agente_retencion) VALUES
    ('CECILIA', '0919214171001', 'AV. 25 DE AGOSTO Y SAN GABRIEL', FALSE),
    ('MECHITA', '0101430700001', 'AV. ALFONSO ANDRADE Y HEROES DE PAQUIZHA ESQ. LATRONCAL', TRUE),
    ('SAN JACINTO', '0302252986001', 'VIA DURAN-TAMBO KM 78', FALSE),
    ('RIO VERDE', '0993400595001', 'VIA DURAN-TAMBO KM 51,5', FALSE),
    ('BBHY SILVAN 1', NULL, 'KM 1.5 VIA BABAHOYO-MONTALVO-GUARANDA', TRUE),
    ('BABA SILVAN 2', NULL, 'KM 0.5 VIA BABA- BABAHOYO', TRUE),
    ('ROCIO', '0992838030001', 'AV. 25 de AGOSTO Y HEROES DE CENEPA', FALSE),
    ('1PETRILLO', NULL, 'GUAYQUIL AV. DEL PERIOSITA', FALSE),
    ('2PETRILLO', NULL, 'GUAYQUIL AV. DEL PERIOSITA', FALSE),
    ('2JIPIJAPA', NULL, 'GUAYQUIL AV. DEL PERIOSITA', FALSE),
    ('3JIPIJAPA', NULL, 'GUAYQUIL AV. DEL PERIOSITA', FALSE),
    ('KM. 48', '0993388968001', 'KM 48 VIA DURAN - EL TAMBO', FALSE),
    ('CADME CORP', '0992395206001', 'AV LAS AMERICAS', TRUE),
    ('SANTA MARTHA', NULL, NULL, FALSE),
    ('COCHANCAY', NULL, NULL, FALSE),
    ('RIRCAY', NULL, NULL, FALSE),
    ('MA. DEL CISNE', NULL, NULL, FALSE);

-- DATOS!AS5:AT12; marca/modelo/año no constan en el catálogo.

INSERT INTO vehiculo (placa, capacidad_galones) VALUES
    ('AAJ0810', 10000),
    ('GQL0920', 10000),
    ('GBN8495', 6000),
    ('JAA2001', 10000),
    ('GNE0711', 6000),
    ('RAB3947', 10000),
    ('GKT0802', 10000),
    ('PCO0466', 10000);

-- TRANS!E4:E330: se conservan los nombres tal como aparecen, sin deducir identidades.
-- SUELDO: remuneración fija diaria confirmada por el usuario; no POR_VIAJE.

INSERT INTO chofer (nombre, cedula, tipo_remuneracion) VALUES
    ('AREVALO', 'PENDIENTE-001', 'DIARIO_FIJO'),
    ('CASTRO', 'PENDIENTE-002', 'DIARIO_FIJO'),
    ('ESPINOZA', 'PENDIENTE-003', 'DIARIO_FIJO'),
    ('GUERRERO', 'PENDIENTE-004', 'DIARIO_FIJO'),
    ('ORTEGA', 'PENDIENTE-005', 'DIARIO_FIJO'),
    ('PEREZ', 'PENDIENTE-006', 'DIARIO_FIJO'),
    ('VICUÑA', 'PENDIENTE-007', 'DIARIO_FIJO');

-- CLIENTES!G3:G4; sin datos fiscales inventados.

INSERT INTO proveedor (nombre) VALUES
    ('TEDASA'),
    ('CEPSA');

-- Ejemplos de inventario y combustibles conservados del seed anterior; no extraídos del Excel.

INSERT INTO categoria_producto (
    nombre,
    descripcion,
    estado,
    es_llanta
)
VALUES
(
    'Llantas',
    'Llantas y neumáticos para los vehículos de la empresa',
    TRUE,
    TRUE
),
(
    'Lubricantes',
    'Aceites, grasas y otros lubricantes utilizados en los vehículos',
    TRUE,
    FALSE
),
(
    'Filtros',
    'Filtros de aceite, combustible, aire y otros filtros para vehículos',
    TRUE,
    FALSE
),
(
    'Repuestos',
    'Repuestos y componentes utilizados para reparación y mantenimiento de vehículos',
    TRUE,
    FALSE
);


-- ============================================================
-- 7. PRODUCTOS DEL INVENTARIO
-- ============================================================

-- Usamos SELECT para no depender de que las categorías
-- necesariamente tengan IDs 1, 2, 3 y 4.

INSERT INTO producto (
    condicion_llanta,
    id_categoria,
    nombre,
    medida,
    modelo,
    marca,
    descripcion,
    unidad_medida,
    stock_minimo,
    estado
)
SELECT
    'NUEVA',
    id_categoria,
    'Llanta para tanquero',
    '11R22.5',
    'R268',
    'Bridgestone',
    'Llanta para vehículo pesado',
    'unidad',
    2,
    TRUE
FROM categoria_producto
WHERE nombre = 'Llantas';


INSERT INTO producto (
    id_categoria,
    nombre,
    medida,
    modelo,
    marca,
    descripcion,
    unidad_medida,
    stock_minimo,
    estado
)
SELECT
    id_categoria,
    'Aceite de motor 15W-40',
    'Galón',
    '15W-40',
    'Mobil',
    'Aceite para motores diésel',
    'galón',
    4,
    TRUE
FROM categoria_producto
WHERE nombre = 'Lubricantes';


INSERT INTO producto (
    id_categoria,
    nombre,
    medida,
    modelo,
    marca,
    descripcion,
    unidad_medida,
    stock_minimo,
    estado
)
SELECT
    id_categoria,
    'Filtro de aceite',
    NULL,
    'LF9009',
    'Fleetguard',
    'Filtro de aceite para motor diésel',
    'unidad',
    2,
    TRUE
FROM categoria_producto
WHERE nombre = 'Filtros';


INSERT INTO producto (
    id_categoria,
    nombre,
    medida,
    modelo,
    marca,
    descripcion,
    unidad_medida,
    stock_minimo,
    estado
)
SELECT
    id_categoria,
    'Filtro de combustible',
    NULL,
    'FF5488',
    'Fleetguard',
    'Filtro de combustible para vehículo pesado',
    'unidad',
    2,
    TRUE
FROM categoria_producto
WHERE nombre = 'Filtros';


INSERT INTO producto (
    id_categoria,
    nombre,
    medida,
    modelo,
    marca,
    descripcion,
    unidad_medida,
    stock_minimo,
    estado
)
SELECT
    id_categoria,
    'Batería para vehículo pesado',
    '12V',
    'N150',
    'Bosch',
    'Batería para tanquero',
    'unidad',
    1,
    TRUE
FROM categoria_producto
WHERE nombre = 'Repuestos';


-- ============================================================
-- 8. PRODUCTOS TRANSPORTADOS
-- ============================================================

INSERT INTO producto_transportado (
    nombre,
    descripcion,
    unidad_medida,
    estado
)
VALUES
(
    'Gasolina Súper',
    'Gasolina de alto octanaje',
    'galones',
    TRUE
),
(
    'Gasolina Extra',
    'Gasolina de uso regular',
    'galones',
    TRUE
),
(
    'Diésel',
    'Combustible diésel para distribución',
    'galones',
    TRUE
),
(
    'Ecopaís',
    'Gasolina Ecopaís para distribución',
    'galones',
    TRUE
);


-- TARIFAS: referencias a celdas originales, sin precios cero ni fórmulas de TRANS.

-- DATOS!G5
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.016,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='CECILIA' AND t.nombre='Terminal La Troncal';

-- DATOS!M5
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.0325,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='CECILIA' AND t.nombre='Terminal Pascuales';

-- DATOS!S5
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.07,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='CECILIA' AND t.nombre='Terminal Santo Domingo';

-- DATOS!Y5
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.052,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='CECILIA' AND t.nombre='Terminal La Libertad';

-- DATOS!G6
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.016,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='MECHITA' AND t.nombre='Terminal La Troncal';

-- DATOS!M6
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.033,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='MECHITA' AND t.nombre='Terminal Pascuales';

-- DATOS!S6
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.07,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='MECHITA' AND t.nombre='Terminal Santo Domingo';

-- DATOS!Y6
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.052,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='MECHITA' AND t.nombre='Terminal La Libertad';

-- DATOS!G8
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.016,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='SAN JACINTO' AND t.nombre='Terminal La Troncal';

-- DATOS!M8
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.033,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='SAN JACINTO' AND t.nombre='Terminal Pascuales';

-- DATOS!S8
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.0725,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='SAN JACINTO' AND t.nombre='Terminal Santo Domingo';

-- DATOS!Y8
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.052,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='SAN JACINTO' AND t.nombre='Terminal La Libertad';

-- DATOS!G9
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.018,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='RIO VERDE' AND t.nombre='Terminal La Troncal';

-- DATOS!M9
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.033,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='RIO VERDE' AND t.nombre='Terminal Pascuales';

-- DATOS!S9
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.0725,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='RIO VERDE' AND t.nombre='Terminal Santo Domingo';

-- DATOS!Y9
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.055,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='RIO VERDE' AND t.nombre='Terminal La Libertad';

-- DATOS!G10
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.032,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='BBHY SILVAN 1' AND t.nombre='Terminal La Troncal';

-- DATOS!M10
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.034,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='BBHY SILVAN 1' AND t.nombre='Terminal Pascuales';

-- DATOS!S10
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.07,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='BBHY SILVAN 1' AND t.nombre='Terminal Santo Domingo';

-- DATOS!Y10
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.052,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='BBHY SILVAN 1' AND t.nombre='Terminal La Libertad';

-- DATOS!G11
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.0335,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='BABA SILVAN 2' AND t.nombre='Terminal La Troncal';

-- DATOS!M11
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.035,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='BABA SILVAN 2' AND t.nombre='Terminal Pascuales';

-- DATOS!S11
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.07,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='BABA SILVAN 2' AND t.nombre='Terminal Santo Domingo';

-- DATOS!Y11
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.052,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='BABA SILVAN 2' AND t.nombre='Terminal La Libertad';

-- DATOS!G12
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.016,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='ROCIO' AND t.nombre='Terminal La Troncal';

-- DATOS!M12
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.035,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='ROCIO' AND t.nombre='Terminal Pascuales';

-- DATOS!S12
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.07,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='ROCIO' AND t.nombre='Terminal Santo Domingo';

-- DATOS!Y12
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.052,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='ROCIO' AND t.nombre='Terminal La Libertad';

-- DATOS!G14
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.03,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='1PETRILLO' AND t.nombre='Terminal La Troncal';

-- DATOS!M14
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.018,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='1PETRILLO' AND t.nombre='Terminal Pascuales';

-- DATOS!S14
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.016,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='1PETRILLO' AND t.nombre='Terminal Santo Domingo';

-- DATOS!G15
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.03,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='2PETRILLO' AND t.nombre='Terminal La Troncal';

-- DATOS!M15
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.018,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='2PETRILLO' AND t.nombre='Terminal Pascuales';

-- DATOS!S15
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.016,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='2PETRILLO' AND t.nombre='Terminal Santo Domingo';

-- DATOS!M18
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.045,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='2JIPIJAPA' AND t.nombre='Terminal Pascuales';

-- DATOS!AK18
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.027,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='2JIPIJAPA' AND t.nombre='Terminal Manta';

-- DATOS!M19
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.045,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='3JIPIJAPA' AND t.nombre='Terminal Pascuales';

-- DATOS!AK19
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.027,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='3JIPIJAPA' AND t.nombre='Terminal Manta';

-- DATOS!G20
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.018,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='KM. 48' AND t.nombre='Terminal La Troncal';

-- DATOS!M20
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.033,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='KM. 48' AND t.nombre='Terminal Pascuales';

-- DATOS!G21
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.02,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='CADME CORP' AND t.nombre='Terminal La Troncal';

-- DATOS!M21
INSERT INTO tarifa (id_gasolinera,id_terminal,valor_por_galon,fecha_inicio,fecha_fin)
SELECT g.id_gasolinera,t.id_terminal,0.035,DATE '2026-01-01',DATE '2026-12-31'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='CADME CORP' AND t.nombre='Terminal Pascuales';


-- TRAYECTOS: ambos sentidos, estimados como mitad de ida/vuelta.
-- No se deducen distancias entre gasolineras ni se crean TRAMO_VIAJE sin un viaje real.

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal La Troncal → CECILIA',t.id_terminal,g.id_gasolinera,11,'ESTIMACIÓN DE PRUEBA: DATOS!H5, 22 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='CECILIA' AND t.nombre='Terminal La Troncal';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'CECILIA → Terminal La Troncal',g.id_gasolinera,t.id_terminal,11,'ESTIMACIÓN DE PRUEBA: DATOS!H5, 22 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='CECILIA' AND t.nombre='Terminal La Troncal';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Pascuales → CECILIA',t.id_terminal,g.id_gasolinera,105,'ESTIMACIÓN DE PRUEBA: DATOS!N5, 210 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='CECILIA' AND t.nombre='Terminal Pascuales';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'CECILIA → Terminal Pascuales',g.id_gasolinera,t.id_terminal,105,'ESTIMACIÓN DE PRUEBA: DATOS!N5, 210 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='CECILIA' AND t.nombre='Terminal Pascuales';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Manta → CECILIA',t.id_terminal,g.id_gasolinera,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL5, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='CECILIA' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'CECILIA → Terminal Manta',g.id_gasolinera,t.id_terminal,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL5, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='CECILIA' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal La Troncal → MECHITA',t.id_terminal,g.id_gasolinera,11,'ESTIMACIÓN DE PRUEBA: DATOS!H6, 22 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='MECHITA' AND t.nombre='Terminal La Troncal';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'MECHITA → Terminal La Troncal',g.id_gasolinera,t.id_terminal,11,'ESTIMACIÓN DE PRUEBA: DATOS!H6, 22 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='MECHITA' AND t.nombre='Terminal La Troncal';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Pascuales → MECHITA',t.id_terminal,g.id_gasolinera,105,'ESTIMACIÓN DE PRUEBA: DATOS!N6, 210 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='MECHITA' AND t.nombre='Terminal Pascuales';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'MECHITA → Terminal Pascuales',g.id_gasolinera,t.id_terminal,105,'ESTIMACIÓN DE PRUEBA: DATOS!N6, 210 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='MECHITA' AND t.nombre='Terminal Pascuales';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Manta → MECHITA',t.id_terminal,g.id_gasolinera,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL6, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='MECHITA' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'MECHITA → Terminal Manta',g.id_gasolinera,t.id_terminal,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL6, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='MECHITA' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal La Troncal → SAN JACINTO',t.id_terminal,g.id_gasolinera,16.5,'ESTIMACIÓN DE PRUEBA: DATOS!H8, 33 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='SAN JACINTO' AND t.nombre='Terminal La Troncal';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'SAN JACINTO → Terminal La Troncal',g.id_gasolinera,t.id_terminal,16.5,'ESTIMACIÓN DE PRUEBA: DATOS!H8, 33 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='SAN JACINTO' AND t.nombre='Terminal La Troncal';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Pascuales → SAN JACINTO',t.id_terminal,g.id_gasolinera,112.5,'ESTIMACIÓN DE PRUEBA: DATOS!N8, 225 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='SAN JACINTO' AND t.nombre='Terminal Pascuales';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'SAN JACINTO → Terminal Pascuales',g.id_gasolinera,t.id_terminal,112.5,'ESTIMACIÓN DE PRUEBA: DATOS!N8, 225 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='SAN JACINTO' AND t.nombre='Terminal Pascuales';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Manta → SAN JACINTO',t.id_terminal,g.id_gasolinera,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL8, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='SAN JACINTO' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'SAN JACINTO → Terminal Manta',g.id_gasolinera,t.id_terminal,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL8, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='SAN JACINTO' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal La Troncal → RIO VERDE',t.id_terminal,g.id_gasolinera,28.25,'ESTIMACIÓN DE PRUEBA: DATOS!H9, 56.5 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='RIO VERDE' AND t.nombre='Terminal La Troncal';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'RIO VERDE → Terminal La Troncal',g.id_gasolinera,t.id_terminal,28.25,'ESTIMACIÓN DE PRUEBA: DATOS!H9, 56.5 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='RIO VERDE' AND t.nombre='Terminal La Troncal';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Pascuales → RIO VERDE',t.id_terminal,g.id_gasolinera,105,'ESTIMACIÓN DE PRUEBA: DATOS!N9, 210 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='RIO VERDE' AND t.nombre='Terminal Pascuales';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'RIO VERDE → Terminal Pascuales',g.id_gasolinera,t.id_terminal,105,'ESTIMACIÓN DE PRUEBA: DATOS!N9, 210 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='RIO VERDE' AND t.nombre='Terminal Pascuales';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Manta → RIO VERDE',t.id_terminal,g.id_gasolinera,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL9, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='RIO VERDE' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'RIO VERDE → Terminal Manta',g.id_gasolinera,t.id_terminal,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL9, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='RIO VERDE' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal La Troncal → BBHY SILVAN 1',t.id_terminal,g.id_gasolinera,110,'ESTIMACIÓN DE PRUEBA: DATOS!H10, 220 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='BBHY SILVAN 1' AND t.nombre='Terminal La Troncal';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'BBHY SILVAN 1 → Terminal La Troncal',g.id_gasolinera,t.id_terminal,110,'ESTIMACIÓN DE PRUEBA: DATOS!H10, 220 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='BBHY SILVAN 1' AND t.nombre='Terminal La Troncal';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Pascuales → BBHY SILVAN 1',t.id_terminal,g.id_gasolinera,105,'ESTIMACIÓN DE PRUEBA: DATOS!N10, 210 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='BBHY SILVAN 1' AND t.nombre='Terminal Pascuales';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'BBHY SILVAN 1 → Terminal Pascuales',g.id_gasolinera,t.id_terminal,105,'ESTIMACIÓN DE PRUEBA: DATOS!N10, 210 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='BBHY SILVAN 1' AND t.nombre='Terminal Pascuales';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Manta → BBHY SILVAN 1',t.id_terminal,g.id_gasolinera,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL10, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='BBHY SILVAN 1' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'BBHY SILVAN 1 → Terminal Manta',g.id_gasolinera,t.id_terminal,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL10, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='BBHY SILVAN 1' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal La Troncal → BABA SILVAN 2',t.id_terminal,g.id_gasolinera,140,'ESTIMACIÓN DE PRUEBA: DATOS!H11, 280 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='BABA SILVAN 2' AND t.nombre='Terminal La Troncal';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'BABA SILVAN 2 → Terminal La Troncal',g.id_gasolinera,t.id_terminal,140,'ESTIMACIÓN DE PRUEBA: DATOS!H11, 280 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='BABA SILVAN 2' AND t.nombre='Terminal La Troncal';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Pascuales → BABA SILVAN 2',t.id_terminal,g.id_gasolinera,130,'ESTIMACIÓN DE PRUEBA: DATOS!N11, 260 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='BABA SILVAN 2' AND t.nombre='Terminal Pascuales';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'BABA SILVAN 2 → Terminal Pascuales',g.id_gasolinera,t.id_terminal,130,'ESTIMACIÓN DE PRUEBA: DATOS!N11, 260 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='BABA SILVAN 2' AND t.nombre='Terminal Pascuales';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Manta → BABA SILVAN 2',t.id_terminal,g.id_gasolinera,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL11, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='BABA SILVAN 2' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'BABA SILVAN 2 → Terminal Manta',g.id_gasolinera,t.id_terminal,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL11, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='BABA SILVAN 2' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal La Troncal → ROCIO',t.id_terminal,g.id_gasolinera,11,'ESTIMACIÓN DE PRUEBA: DATOS!H12, 22 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='ROCIO' AND t.nombre='Terminal La Troncal';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'ROCIO → Terminal La Troncal',g.id_gasolinera,t.id_terminal,11,'ESTIMACIÓN DE PRUEBA: DATOS!H12, 22 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='ROCIO' AND t.nombre='Terminal La Troncal';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Pascuales → ROCIO',t.id_terminal,g.id_gasolinera,105,'ESTIMACIÓN DE PRUEBA: DATOS!N12, 210 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='ROCIO' AND t.nombre='Terminal Pascuales';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'ROCIO → Terminal Pascuales',g.id_gasolinera,t.id_terminal,105,'ESTIMACIÓN DE PRUEBA: DATOS!N12, 210 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='ROCIO' AND t.nombre='Terminal Pascuales';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Manta → ROCIO',t.id_terminal,g.id_gasolinera,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL12, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='ROCIO' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'ROCIO → Terminal Manta',g.id_gasolinera,t.id_terminal,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL12, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='ROCIO' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal La Troncal → 1PETRILLO',t.id_terminal,g.id_gasolinera,65,'ESTIMACIÓN DE PRUEBA: DATOS!H14, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='1PETRILLO' AND t.nombre='Terminal La Troncal';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT '1PETRILLO → Terminal La Troncal',g.id_gasolinera,t.id_terminal,65,'ESTIMACIÓN DE PRUEBA: DATOS!H14, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='1PETRILLO' AND t.nombre='Terminal La Troncal';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Pascuales → 1PETRILLO',t.id_terminal,g.id_gasolinera,16,'ESTIMACIÓN DE PRUEBA: DATOS!N14, 32 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='1PETRILLO' AND t.nombre='Terminal Pascuales';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT '1PETRILLO → Terminal Pascuales',g.id_gasolinera,t.id_terminal,16,'ESTIMACIÓN DE PRUEBA: DATOS!N14, 32 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='1PETRILLO' AND t.nombre='Terminal Pascuales';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Manta → 1PETRILLO',t.id_terminal,g.id_gasolinera,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL14, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='1PETRILLO' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT '1PETRILLO → Terminal Manta',g.id_gasolinera,t.id_terminal,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL14, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='1PETRILLO' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Pascuales → 2PETRILLO',t.id_terminal,g.id_gasolinera,16,'ESTIMACIÓN DE PRUEBA: DATOS!N15, 32 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='2PETRILLO' AND t.nombre='Terminal Pascuales';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT '2PETRILLO → Terminal Pascuales',g.id_gasolinera,t.id_terminal,16,'ESTIMACIÓN DE PRUEBA: DATOS!N15, 32 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='2PETRILLO' AND t.nombre='Terminal Pascuales';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Manta → 2PETRILLO',t.id_terminal,g.id_gasolinera,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL15, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='2PETRILLO' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT '2PETRILLO → Terminal Manta',g.id_gasolinera,t.id_terminal,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL15, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='2PETRILLO' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Manta → 2JIPIJAPA',t.id_terminal,g.id_gasolinera,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL18, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='2JIPIJAPA' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT '2JIPIJAPA → Terminal Manta',g.id_gasolinera,t.id_terminal,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL18, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='2JIPIJAPA' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Santo Domingo → 3JIPIJAPA',t.id_terminal,g.id_gasolinera,65,'ESTIMACIÓN DE PRUEBA: DATOS!T19, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='3JIPIJAPA' AND t.nombre='Terminal Santo Domingo';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT '3JIPIJAPA → Terminal Santo Domingo',g.id_gasolinera,t.id_terminal,65,'ESTIMACIÓN DE PRUEBA: DATOS!T19, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='3JIPIJAPA' AND t.nombre='Terminal Santo Domingo';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Manta → 3JIPIJAPA',t.id_terminal,g.id_gasolinera,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL19, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='3JIPIJAPA' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT '3JIPIJAPA → Terminal Manta',g.id_gasolinera,t.id_terminal,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL19, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='3JIPIJAPA' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal La Troncal → KM. 48',t.id_terminal,g.id_gasolinera,37.5,'ESTIMACIÓN DE PRUEBA: DATOS!H20, 75 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='KM. 48' AND t.nombre='Terminal La Troncal';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'KM. 48 → Terminal La Troncal',g.id_gasolinera,t.id_terminal,37.5,'ESTIMACIÓN DE PRUEBA: DATOS!H20, 75 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='KM. 48' AND t.nombre='Terminal La Troncal';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Santo Domingo → KM. 48',t.id_terminal,g.id_gasolinera,65,'ESTIMACIÓN DE PRUEBA: DATOS!T20, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='KM. 48' AND t.nombre='Terminal Santo Domingo';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'KM. 48 → Terminal Santo Domingo',g.id_gasolinera,t.id_terminal,65,'ESTIMACIÓN DE PRUEBA: DATOS!T20, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='KM. 48' AND t.nombre='Terminal Santo Domingo';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Manta → KM. 48',t.id_terminal,g.id_gasolinera,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL20, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='KM. 48' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'KM. 48 → Terminal Manta',g.id_gasolinera,t.id_terminal,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL20, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='KM. 48' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_terminal_origen,id_gasolinera_destino,kilometros,observacion)
SELECT 'Terminal Manta → CADME CORP',t.id_terminal,g.id_gasolinera,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL21, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='CADME CORP' AND t.nombre='Terminal Manta';

INSERT INTO trayecto (nombre,id_gasolinera_origen,id_terminal_destino,kilometros,observacion)
SELECT 'CADME CORP → Terminal Manta',g.id_gasolinera,t.id_terminal,65,'ESTIMACIÓN DE PRUEBA: DATOS!AL21, 130 km ida/vuelta ÷ 2. Confirmar distancia por sentido antes de uso operativo.'
FROM gasolinera g CROSS JOIN terminal t
WHERE g.nombre='CADME CORP' AND t.nombre='Terminal Manta';


INSERT INTO configuracion_remuneracion(importe_diario,adicional_dia_especial,fecha_inicio,observacion)
VALUES (35,35,'2026-01-01','Importes diarios acordados; feriados deben configurarse antes de generar remuneraciones');
-- INICIO TRAYECTOS ENTRE GASOLINERAS (generado)
-- Fuente y coordenadas: data/ubicaciones_gasolineras.json.
-- Respuesta de rutas: data/distancias_gasolineras_osrm.json (2026-10-16).
-- OSRM driving / OpenStreetMap: distancia de ruta por carretera en cada sentido.
-- Aproximaciones de desarrollo; no validan restricciones de tanqueros ni mercancías peligrosas.
-- 14 estaciones ubicadas, 182 trayectos; 3 estaciones pendientes de ubicación.
INSERT INTO trayecto (nombre,id_gasolinera_origen,id_gasolinera_destino,kilometros,observacion)
SELECT origen.nombre || ' → ' || destino.nombre,origen.id_gasolinera,destino.id_gasolinera,r.kilometros,
    'ESTIMACIÓN DE PRUEBA: OSRM driving/OpenStreetMap 2026-10-16; carretera por sentido, redondeada a 0,1 km. No valida acceso de tanqueros. Fuentes: database/data/ubicaciones_gasolineras.json.'
FROM (VALUES
    ('CECILIA', 'MECHITA', 1.40),
    ('CECILIA', 'RIO VERDE', 33.40),
    ('CECILIA', 'BBHY SILVAN 1', 106.20),
    ('CECILIA', 'BABA SILVAN 2', 122.70),
    ('CECILIA', '1PETRILLO', 103.50),
    ('CECILIA', '2PETRILLO', 103.50),
    ('CECILIA', '2JIPIJAPA', 213.10),
    ('CECILIA', '3JIPIJAPA', 212.50),
    ('CECILIA', 'COCHANCAY', 8.70),
    ('CECILIA', 'RIRCAY', 1.30),
    ('CECILIA', 'MA. DEL CISNE', 29.90),
    ('CECILIA', 'SAN JACINTO', 10.30),
    ('CECILIA', 'ROCIO', 128.90),
    ('MECHITA', 'CECILIA', 1.00),
    ('MECHITA', 'RIO VERDE', 35.40),
    ('MECHITA', 'BBHY SILVAN 1', 108.10),
    ('MECHITA', 'BABA SILVAN 2', 124.70),
    ('MECHITA', '1PETRILLO', 105.50),
    ('MECHITA', '2PETRILLO', 105.50),
    ('MECHITA', '2JIPIJAPA', 215.10),
    ('MECHITA', '3JIPIJAPA', 214.40),
    ('MECHITA', 'COCHANCAY', 7.60),
    ('MECHITA', 'RIRCAY', 2.00),
    ('MECHITA', 'MA. DEL CISNE', 31.90),
    ('MECHITA', 'SAN JACINTO', 9.20),
    ('MECHITA', 'ROCIO', 127.80),
    ('RIO VERDE', 'CECILIA', 17.90),
    ('RIO VERDE', 'MECHITA', 19.80),
    ('RIO VERDE', 'BBHY SILVAN 1', 94.40),
    ('RIO VERDE', 'BABA SILVAN 2', 111.00),
    ('RIO VERDE', '1PETRILLO', 91.70),
    ('RIO VERDE', '2PETRILLO', 91.70),
    ('RIO VERDE', '2JIPIJAPA', 201.30),
    ('RIO VERDE', '3JIPIJAPA', 200.70),
    ('RIO VERDE', 'COCHANCAY', 25.50),
    ('RIO VERDE', 'RIRCAY', 16.70),
    ('RIO VERDE', 'MA. DEL CISNE', 18.20),
    ('RIO VERDE', 'SAN JACINTO', 27.10),
    ('RIO VERDE', 'ROCIO', 145.70),
    ('BBHY SILVAN 1', 'CECILIA', 106.40),
    ('BBHY SILVAN 1', 'MECHITA', 108.30),
    ('BBHY SILVAN 1', 'RIO VERDE', 88.60),
    ('BBHY SILVAN 1', 'BABA SILVAN 2', 25.10),
    ('BBHY SILVAN 1', '1PETRILLO', 93.70),
    ('BBHY SILVAN 1', '2PETRILLO', 93.70),
    ('BBHY SILVAN 1', '2JIPIJAPA', 192.70),
    ('BBHY SILVAN 1', '3JIPIJAPA', 192.00),
    ('BBHY SILVAN 1', 'COCHANCAY', 114.00),
    ('BBHY SILVAN 1', 'RIRCAY', 105.20),
    ('BBHY SILVAN 1', 'MA. DEL CISNE', 85.20),
    ('BBHY SILVAN 1', 'SAN JACINTO', 115.60),
    ('BBHY SILVAN 1', 'ROCIO', 234.20),
    ('BABA SILVAN 2', 'CECILIA', 122.70),
    ('BABA SILVAN 2', 'MECHITA', 124.60),
    ('BABA SILVAN 2', 'RIO VERDE', 104.90),
    ('BABA SILVAN 2', 'BBHY SILVAN 1', 25.20),
    ('BABA SILVAN 2', '1PETRILLO', 68.70),
    ('BABA SILVAN 2', '2PETRILLO', 68.70),
    ('BABA SILVAN 2', '2JIPIJAPA', 167.70),
    ('BABA SILVAN 2', '3JIPIJAPA', 167.00),
    ('BABA SILVAN 2', 'COCHANCAY', 130.30),
    ('BABA SILVAN 2', 'RIRCAY', 121.50),
    ('BABA SILVAN 2', 'MA. DEL CISNE', 101.40),
    ('BABA SILVAN 2', 'SAN JACINTO', 131.90),
    ('BABA SILVAN 2', 'ROCIO', 250.50),
    ('1PETRILLO', 'CECILIA', 104.90),
    ('1PETRILLO', 'MECHITA', 106.80),
    ('1PETRILLO', 'RIO VERDE', 87.10),
    ('1PETRILLO', 'BBHY SILVAN 1', 93.60),
    ('1PETRILLO', 'BABA SILVAN 2', 68.50),
    ('1PETRILLO', '2PETRILLO', 0.10),
    ('1PETRILLO', '2JIPIJAPA', 109.70),
    ('1PETRILLO', '3JIPIJAPA', 109.00),
    ('1PETRILLO', 'COCHANCAY', 112.50),
    ('1PETRILLO', 'RIRCAY', 103.70),
    ('1PETRILLO', 'MA. DEL CISNE', 83.60),
    ('1PETRILLO', 'SAN JACINTO', 114.10),
    ('1PETRILLO', 'ROCIO', 232.70),
    ('2PETRILLO', 'CECILIA', 104.80),
    ('2PETRILLO', 'MECHITA', 106.70),
    ('2PETRILLO', 'RIO VERDE', 87.00),
    ('2PETRILLO', 'BBHY SILVAN 1', 93.70),
    ('2PETRILLO', 'BABA SILVAN 2', 68.60),
    ('2PETRILLO', '1PETRILLO', 0.20),
    ('2PETRILLO', '2JIPIJAPA', 109.80),
    ('2PETRILLO', '3JIPIJAPA', 109.10),
    ('2PETRILLO', 'COCHANCAY', 112.40),
    ('2PETRILLO', 'RIRCAY', 103.60),
    ('2PETRILLO', 'MA. DEL CISNE', 83.60),
    ('2PETRILLO', 'SAN JACINTO', 114.00),
    ('2PETRILLO', 'ROCIO', 232.60),
    ('2JIPIJAPA', 'CECILIA', 214.10),
    ('2JIPIJAPA', 'MECHITA', 216.00),
    ('2JIPIJAPA', 'RIO VERDE', 196.40),
    ('2JIPIJAPA', 'BBHY SILVAN 1', 192.50),
    ('2JIPIJAPA', 'BABA SILVAN 2', 167.40),
    ('2JIPIJAPA', '1PETRILLO', 109.40),
    ('2JIPIJAPA', '2PETRILLO', 109.40),
    ('2JIPIJAPA', '3JIPIJAPA', 2.80),
    ('2JIPIJAPA', 'COCHANCAY', 221.70),
    ('2JIPIJAPA', 'RIRCAY', 212.90),
    ('2JIPIJAPA', 'MA. DEL CISNE', 192.90),
    ('2JIPIJAPA', 'SAN JACINTO', 223.40),
    ('2JIPIJAPA', 'ROCIO', 341.90),
    ('3JIPIJAPA', 'CECILIA', 211.30),
    ('3JIPIJAPA', 'MECHITA', 213.20),
    ('3JIPIJAPA', 'RIO VERDE', 193.60),
    ('3JIPIJAPA', 'BBHY SILVAN 1', 189.70),
    ('3JIPIJAPA', 'BABA SILVAN 2', 164.60),
    ('3JIPIJAPA', '1PETRILLO', 106.60),
    ('3JIPIJAPA', '2PETRILLO', 106.60),
    ('3JIPIJAPA', '2JIPIJAPA', 3.10),
    ('3JIPIJAPA', 'COCHANCAY', 218.90),
    ('3JIPIJAPA', 'RIRCAY', 210.10),
    ('3JIPIJAPA', 'MA. DEL CISNE', 190.10),
    ('3JIPIJAPA', 'SAN JACINTO', 220.50),
    ('3JIPIJAPA', 'ROCIO', 339.10),
    ('COCHANCAY', 'CECILIA', 8.90),
    ('COCHANCAY', 'MECHITA', 7.30),
    ('COCHANCAY', 'RIO VERDE', 41.00),
    ('COCHANCAY', 'BBHY SILVAN 1', 113.80),
    ('COCHANCAY', 'BABA SILVAN 2', 130.30),
    ('COCHANCAY', '1PETRILLO', 111.10),
    ('COCHANCAY', '2PETRILLO', 111.10),
    ('COCHANCAY', '2JIPIJAPA', 220.70),
    ('COCHANCAY', '3JIPIJAPA', 220.00),
    ('COCHANCAY', 'RIRCAY', 11.00),
    ('COCHANCAY', 'MA. DEL CISNE', 37.50),
    ('COCHANCAY', 'SAN JACINTO', 1.60),
    ('COCHANCAY', 'ROCIO', 120.20),
    ('RIRCAY', 'CECILIA', 1.20),
    ('RIRCAY', 'MECHITA', 2.60),
    ('RIRCAY', 'RIO VERDE', 32.10),
    ('RIRCAY', 'BBHY SILVAN 1', 104.80),
    ('RIRCAY', 'BABA SILVAN 2', 121.40),
    ('RIRCAY', '1PETRILLO', 102.20),
    ('RIRCAY', '2PETRILLO', 102.20),
    ('RIRCAY', '2JIPIJAPA', 211.80),
    ('RIRCAY', '3JIPIJAPA', 211.10),
    ('RIRCAY', 'COCHANCAY', 11.10),
    ('RIRCAY', 'MA. DEL CISNE', 28.60),
    ('RIRCAY', 'SAN JACINTO', 12.70),
    ('RIRCAY', 'ROCIO', 131.30),
    ('MA. DEL CISNE', 'CECILIA', 21.30),
    ('MA. DEL CISNE', 'MECHITA', 23.20),
    ('MA. DEL CISNE', 'RIO VERDE', 3.50),
    ('MA. DEL CISNE', 'BBHY SILVAN 1', 97.80),
    ('MA. DEL CISNE', 'BABA SILVAN 2', 114.30),
    ('MA. DEL CISNE', '1PETRILLO', 95.10),
    ('MA. DEL CISNE', '2PETRILLO', 95.10),
    ('MA. DEL CISNE', '2JIPIJAPA', 204.70),
    ('MA. DEL CISNE', '3JIPIJAPA', 204.10),
    ('MA. DEL CISNE', 'COCHANCAY', 28.90),
    ('MA. DEL CISNE', 'RIRCAY', 20.10),
    ('MA. DEL CISNE', 'SAN JACINTO', 30.50),
    ('MA. DEL CISNE', 'ROCIO', 149.10),
    ('SAN JACINTO', 'CECILIA', 11.00),
    ('SAN JACINTO', 'MECHITA', 9.50),
    ('SAN JACINTO', 'RIO VERDE', 43.20),
    ('SAN JACINTO', 'BBHY SILVAN 1', 115.90),
    ('SAN JACINTO', 'BABA SILVAN 2', 132.50),
    ('SAN JACINTO', '1PETRILLO', 113.30),
    ('SAN JACINTO', '2PETRILLO', 113.20),
    ('SAN JACINTO', '2JIPIJAPA', 222.90),
    ('SAN JACINTO', '3JIPIJAPA', 222.20),
    ('SAN JACINTO', 'COCHANCAY', 2.20),
    ('SAN JACINTO', 'RIRCAY', 13.20),
    ('SAN JACINTO', 'MA. DEL CISNE', 39.70),
    ('SAN JACINTO', 'ROCIO', 118.60),
    ('ROCIO', 'CECILIA', 129.00),
    ('ROCIO', 'MECHITA', 127.50),
    ('ROCIO', 'RIO VERDE', 161.10),
    ('ROCIO', 'BBHY SILVAN 1', 233.90),
    ('ROCIO', 'BABA SILVAN 2', 250.50),
    ('ROCIO', '1PETRILLO', 231.20),
    ('ROCIO', '2PETRILLO', 231.20),
    ('ROCIO', '2JIPIJAPA', 340.80),
    ('ROCIO', '3JIPIJAPA', 340.20),
    ('ROCIO', 'COCHANCAY', 120.20),
    ('ROCIO', 'RIRCAY', 131.20),
    ('ROCIO', 'MA. DEL CISNE', 157.60),
    ('ROCIO', 'SAN JACINTO', 119.10)
) AS r(origen,destino,kilometros)
JOIN gasolinera origen ON origen.nombre=r.origen
JOIN gasolinera destino ON destino.nombre=r.destino;
-- FIN TRAYECTOS ENTRE GASOLINERAS (generado)
COMMIT;
