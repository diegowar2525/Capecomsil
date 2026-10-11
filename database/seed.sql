BEGIN;

-- ============================================================
-- CAPECOMSIL - DATOS INICIALES DE PRUEBA
-- ============================================================


-- ============================================================
-- 1. TERMINALES
-- ============================================================

INSERT INTO terminal (
    nombre,
    ubicacion,
    estado
)
VALUES
(
    'Terminal Pascuales',
    'Guayaquil, Guayas',
    TRUE
),
(
    'Terminal La Libertad',
    'La Libertad, Santa Elena',
    TRUE
);


-- ============================================================
-- 2. GASOLINERAS
-- ============================================================

INSERT INTO gasolinera (
    nombre,
    ruc,
    direccion,
    telefono,
    correo,
    representante_legal,
    agente_retencion,
    estado
)
VALUES
(
    'Gasolinera Rocío',
    '0991234567001',
    'Av. Principal, Guayaquil',
    '042345678',
    'rocio@prueba.com',
    'Carlos Andrade',
    TRUE,
    TRUE
),
(
    'Gasolinera Los Andes',
    '0997654321001',
    'Av. Central, Milagro',
    '042987654',
    'losandes@prueba.com',
    'María Torres',
    FALSE,
    TRUE
);


-- ============================================================
-- 3. VEHÍCULOS
-- ============================================================

INSERT INTO vehiculo (
    placa,
    marca,
    modelo,
    anio,
    capacidad_galones,
    estado
)
VALUES
(
    'GOC1244',
    'Kenworth',
    'T800',
    2018,
    10000,
    TRUE
),
(
    'GOC5678',
    'Freightliner',
    'Cascadia',
    2020,
    10000,
    TRUE
);


-- ============================================================
-- 4. CHOFERES
-- ============================================================

INSERT INTO chofer (
    nombre,
    cedula,
    telefono,
    tipo_remuneracion,
    estado
)
VALUES
(
    'José Mendoza',
    '0912345678',
    '0991234567',
    'SUELDO',
    TRUE
),
(
    'Luis Zambrano',
    '0923456789',
    '0982345678',
    'POR_VIAJE',
    TRUE
);


-- ============================================================
-- 5. PROVEEDORES
-- ============================================================

INSERT INTO proveedor (
    nombre,
    ruc,
    direccion,
    telefono,
    correo,
    estado
)
VALUES
(
    'Repuestos del Austro',
    '0198765432001',
    'Av. Principal, Cuenca',
    '072345678',
    'ventas@repuestos-austro.test',
    TRUE
),
(
    'Lubricantes del Pacífico',
    '0998765432001',
    'Av. Industrial, Guayaquil',
    '042456789',
    'ventas@lubricantes-pacifico.test',
    TRUE
);


-- ============================================================
-- 6. CATEGORÍAS DE PRODUCTOS DEL INVENTARIO
-- ============================================================

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


-- ============================================================
-- 9. TARIFAS
-- ============================================================

-- Rocío + Pascuales
-- Tarifa histórica hasta septiembre de 2026.

INSERT INTO tarifa (
    id_gasolinera,
    id_terminal,
    valor_por_galon,
    fecha_inicio,
    fecha_fin,
    estado
)
SELECT
    g.id_gasolinera,
    t.id_terminal,
    0.035,
    DATE '2026-01-01',
    DATE '2026-09-30',
    TRUE
FROM gasolinera g
CROSS JOIN terminal t
WHERE g.nombre = 'Gasolinera Rocío'
  AND t.nombre = 'Terminal Pascuales';


-- Rocío + Pascuales
-- Nueva tarifa desde octubre de 2026.

INSERT INTO tarifa (
    id_gasolinera,
    id_terminal,
    valor_por_galon,
    fecha_inicio,
    fecha_fin,
    estado
)
SELECT
    g.id_gasolinera,
    t.id_terminal,
    0.040,
    DATE '2026-10-01',
    NULL,
    TRUE
FROM gasolinera g
CROSS JOIN terminal t
WHERE g.nombre = 'Gasolinera Rocío'
  AND t.nombre = 'Terminal Pascuales';


-- Rocío + La Libertad

INSERT INTO tarifa (
    id_gasolinera,
    id_terminal,
    valor_por_galon,
    fecha_inicio,
    fecha_fin,
    estado
)
SELECT
    g.id_gasolinera,
    t.id_terminal,
    0.045,
    DATE '2026-01-01',
    NULL,
    TRUE
FROM gasolinera g
CROSS JOIN terminal t
WHERE g.nombre = 'Gasolinera Rocío'
  AND t.nombre = 'Terminal La Libertad';


-- Los Andes + Pascuales

INSERT INTO tarifa (
    id_gasolinera,
    id_terminal,
    valor_por_galon,
    fecha_inicio,
    fecha_fin,
    estado
)
SELECT
    g.id_gasolinera,
    t.id_terminal,
    0.040,
    DATE '2026-01-01',
    NULL,
    TRUE
FROM gasolinera g
CROSS JOIN terminal t
WHERE g.nombre = 'Gasolinera Los Andes'
  AND t.nombre = 'Terminal Pascuales';


COMMIT;