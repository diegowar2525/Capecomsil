-- =====================================================
-- CAPECOMSIL
-- Esquema inicial de la base de datos
-- PostgreSQL
-- Después de crear este esquema, ejecutar migrations/001_tarifa_reglas.sql.
-- =====================================================


-- =====================================================
-- 1. TABLAS INDEPENDIENTES
-- =====================================================

CREATE TABLE terminal (
    id_terminal INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(255),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
);


CREATE TABLE vehiculo (
    id_vehiculo INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    placa VARCHAR(20) NOT NULL UNIQUE,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    anio INTEGER,
    capacidad_galones NUMERIC(12, 2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT chk_vehiculo_capacidad
        CHECK (capacidad_galones > 0),

    CONSTRAINT chk_vehiculo_anio
        CHECK (anio IS NULL OR anio > 0)
);


CREATE TABLE chofer (
    id_chofer INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    cedula VARCHAR(20) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    tipo_remuneracion VARCHAR(50),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
);


CREATE TABLE gasolinera (
    id_gasolinera INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    ruc VARCHAR(20) UNIQUE,
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    correo VARCHAR(150),
    representante_legal VARCHAR(150),
    agente_retencion BOOLEAN NOT NULL DEFAULT FALSE,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
);


CREATE TABLE proveedor (
    id_proveedor INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    ruc VARCHAR(20) UNIQUE,
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    correo VARCHAR(150),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
);


CREATE TABLE categoria_producto (
    id_categoria INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
);


CREATE TABLE producto_transportado (
    id_producto_transportado INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    unidad_medida VARCHAR(30) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
);

CREATE TABLE producto (
    id_producto INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_categoria INTEGER NOT NULL,

    nombre VARCHAR(150) NOT NULL,
    medida VARCHAR(50),
    modelo VARCHAR(100),
    marca VARCHAR(100),
    descripcion TEXT,
    unidad_medida VARCHAR(30) NOT NULL,
    stock_minimo NUMERIC(12, 2) NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_producto_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES categoria_producto(id_categoria),

    CONSTRAINT chk_producto_stock_minimo
        CHECK (stock_minimo >= 0)
);



-- =====================================================
-- 2. TARIFAS
-- =====================================================

CREATE TABLE tarifa (
    id_tarifa INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_gasolinera INTEGER NOT NULL,
    id_terminal INTEGER NOT NULL,
    valor_por_galon NUMERIC(12, 4) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT fk_tarifa_gasolinera
        FOREIGN KEY (id_gasolinera)
        REFERENCES gasolinera(id_gasolinera),

    CONSTRAINT fk_tarifa_terminal
        FOREIGN KEY (id_terminal)
        REFERENCES terminal(id_terminal),

    CONSTRAINT chk_tarifa_valor
        CHECK (valor_por_galon >= 0),

    CONSTRAINT chk_tarifa_fechas
        CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);


-- =====================================================
-- 3. LIQUIDACIONES
-- =====================================================

CREATE TABLE liquidacion (
    id_liquidacion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_gasolinera INTEGER NOT NULL,

    fecha_generacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_limite_confirmacion DATE,
    fecha_confirmacion TIMESTAMP,

    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,

    total_galones NUMERIC(14, 2) NOT NULL DEFAULT 0,
    valor_transporte NUMERIC(14, 2) NOT NULL DEFAULT 0,
    retencion NUMERIC(14, 2) NOT NULL DEFAULT 0,
    recargo NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_liquidacion NUMERIC(14, 2) NOT NULL DEFAULT 0,

    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE_CONFIRMACION',
    observacion TEXT,

    CONSTRAINT fk_liquidacion_gasolinera
        FOREIGN KEY (id_gasolinera)
        REFERENCES gasolinera(id_gasolinera),

    CONSTRAINT chk_liquidacion_periodo
        CHECK (periodo_fin >= periodo_inicio),

    CONSTRAINT chk_liquidacion_valores
        CHECK (
            total_galones >= 0
            AND valor_transporte >= 0
            AND retencion >= 0
            AND recargo >= 0
            AND total_liquidacion >= 0
        )
);


-- =====================================================
-- 4. VIAJES
-- =====================================================

CREATE TABLE viaje (
    id_viaje INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_tarifa INTEGER NOT NULL,
    id_vehiculo INTEGER NOT NULL,
    id_chofer INTEGER NOT NULL,
    id_liquidacion INTEGER,

    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT fk_viaje_tarifa
        FOREIGN KEY (id_tarifa)
        REFERENCES tarifa(id_tarifa),

    CONSTRAINT fk_viaje_vehiculo
        FOREIGN KEY (id_vehiculo)
        REFERENCES vehiculo(id_vehiculo),

    CONSTRAINT fk_viaje_chofer
        FOREIGN KEY (id_chofer)
        REFERENCES chofer(id_chofer),

    CONSTRAINT fk_viaje_liquidacion
        FOREIGN KEY (id_liquidacion)
        REFERENCES liquidacion(id_liquidacion)
);


CREATE TABLE detalle_viaje (
    id_detalle_viaje INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_viaje INTEGER NOT NULL,
    id_producto_transportado INTEGER NOT NULL,

    galones NUMERIC(14, 2) NOT NULL,
    tarifa_aplicada NUMERIC(12, 4) NOT NULL,
    valor_transporte NUMERIC(14, 2) NOT NULL,

    CONSTRAINT fk_detalle_viaje_viaje
        FOREIGN KEY (id_viaje)
        REFERENCES viaje(id_viaje),

    CONSTRAINT fk_detalle_viaje_producto
        FOREIGN KEY (id_producto_transportado)
        REFERENCES producto_transportado(id_producto_transportado),

    CONSTRAINT chk_detalle_viaje_valores
        CHECK (
            galones > 0
            AND tarifa_aplicada >= 0
            AND valor_transporte >= 0
        )
);


CREATE TABLE costo_viaje (
    id_costo INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_viaje INTEGER NOT NULL,
    tipo_costo VARCHAR(100) NOT NULL,
    valor NUMERIC(12, 2) NOT NULL,
    descripcion TEXT,

    CONSTRAINT fk_costo_viaje
        FOREIGN KEY (id_viaje)
        REFERENCES viaje(id_viaje),

    CONSTRAINT chk_costo_viaje_valor
        CHECK (valor >= 0)
);


-- =====================================================
-- 5. FACTURACIÓN A GASOLINERAS Y PAGOS
-- =====================================================

CREATE TABLE factura (
    id_factura INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_liquidacion INTEGER NOT NULL UNIQUE,

    numero_factura VARCHAR(50) NOT NULL UNIQUE,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,

    subtotal NUMERIC(14, 2) NOT NULL,
    retencion NUMERIC(14, 2) NOT NULL DEFAULT 0,
    valor_neto NUMERIC(14, 2) NOT NULL,

    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    observacion TEXT,

    CONSTRAINT fk_factura_liquidacion
        FOREIGN KEY (id_liquidacion)
        REFERENCES liquidacion(id_liquidacion),

    CONSTRAINT chk_factura_valores
        CHECK (subtotal >= 0 AND retencion >= 0 AND valor_neto >= 0)
);


CREATE TABLE pago (
    id_pago INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_factura INTEGER NOT NULL,

    fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
    monto NUMERIC(14, 2) NOT NULL,
    forma_pago VARCHAR(50),
    banco VARCHAR(100),
    numero_comprobante VARCHAR(100),
    observacion TEXT,

    CONSTRAINT fk_pago_factura
        FOREIGN KEY (id_factura)
        REFERENCES factura(id_factura),

    CONSTRAINT chk_pago_monto
        CHECK (monto > 0)
);


-- =====================================================
-- 6. GASTOS
-- =====================================================

CREATE TABLE gasto (
    id_gasto INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_viaje INTEGER,
    id_vehiculo INTEGER NOT NULL,
    id_proveedor INTEGER,

    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo_gasto VARCHAR(100) NOT NULL,
    monto NUMERIC(14, 2) NOT NULL,
    descripcion TEXT,
    numero_comprobante VARCHAR(100),
    observacion TEXT,

    CONSTRAINT fk_gasto_viaje
        FOREIGN KEY (id_viaje)
        REFERENCES viaje(id_viaje),

    CONSTRAINT fk_gasto_vehiculo
        FOREIGN KEY (id_vehiculo)
        REFERENCES vehiculo(id_vehiculo),

    CONSTRAINT fk_gasto_proveedor
        FOREIGN KEY (id_proveedor)
        REFERENCES proveedor(id_proveedor),

    CONSTRAINT chk_gasto_monto
        CHECK (monto >= 0)
);


-- =====================================================
-- 7. FACTURAS DE PROVEEDORES
-- =====================================================

CREATE TABLE factura_proveedor (
    id_factura_proveedor INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_proveedor INTEGER NOT NULL,

    numero_factura VARCHAR(50) NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE,
    monto_total NUMERIC(14, 2) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    detalle TEXT,

    CONSTRAINT fk_factura_proveedor_proveedor
        FOREIGN KEY (id_proveedor)
        REFERENCES proveedor(id_proveedor),

    CONSTRAINT chk_factura_proveedor_monto
        CHECK (monto_total >= 0),

    CONSTRAINT uq_factura_proveedor_numero
        UNIQUE (id_proveedor, numero_factura)
);


CREATE TABLE detalle_factura_proveedor (
    id_detalle_factura_proveedor INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_factura_proveedor INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,

    cantidad NUMERIC(12, 2) NOT NULL,
    precio_unitario NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(14, 2) NOT NULL,

    CONSTRAINT fk_detalle_factura_proveedor_factura
        FOREIGN KEY (id_factura_proveedor)
        REFERENCES factura_proveedor(id_factura_proveedor),

    CONSTRAINT fk_detalle_factura_proveedor_producto
        FOREIGN KEY (id_producto)
        REFERENCES producto(id_producto),

    CONSTRAINT chk_detalle_factura_proveedor_valores
        CHECK (
            cantidad > 0
            AND precio_unitario >= 0
            AND subtotal >= 0
        )
);


CREATE TABLE pago_proveedor (
    id_pago_proveedor INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_factura_proveedor INTEGER NOT NULL,

    fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
    monto NUMERIC(14, 2) NOT NULL,
    forma_pago VARCHAR(50),
    numero_cheque VARCHAR(100),
    numero_comprobante VARCHAR(100),
    observacion TEXT,

    CONSTRAINT fk_pago_proveedor_factura
        FOREIGN KEY (id_factura_proveedor)
        REFERENCES factura_proveedor(id_factura_proveedor),

    CONSTRAINT chk_pago_proveedor_monto
        CHECK (monto > 0)
);


-- =====================================================
-- 8. INVENTARIO
-- =====================================================

CREATE TABLE movimiento_inventario (
    id_movimiento INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_producto INTEGER NOT NULL,

    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_movimiento VARCHAR(20) NOT NULL,
    cantidad NUMERIC(12, 2) NOT NULL,
    motivo VARCHAR(150) NOT NULL,
    observacion TEXT,

    CONSTRAINT fk_movimiento_producto
        FOREIGN KEY (id_producto)
        REFERENCES producto(id_producto),

    CONSTRAINT chk_movimiento_tipo
        CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA', 'AJUSTE')),

    CONSTRAINT chk_movimiento_cantidad
        CHECK (cantidad > 0)
);


-- =====================================================
-- 9. MANTENIMIENTOS
-- =====================================================

CREATE TABLE mantenimiento (
    id_mantenimiento INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_vehiculo INTEGER NOT NULL,
    id_proveedor INTEGER,

    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo VARCHAR(100) NOT NULL,
    monto NUMERIC(14, 2) NOT NULL,
    descripcion TEXT,
    observacion TEXT,

    CONSTRAINT fk_mantenimiento_vehiculo
        FOREIGN KEY (id_vehiculo)
        REFERENCES vehiculo(id_vehiculo),

    CONSTRAINT fk_mantenimiento_proveedor
        FOREIGN KEY (id_proveedor)
        REFERENCES proveedor(id_proveedor),

    CONSTRAINT chk_mantenimiento_monto
        CHECK (monto >= 0)
);


CREATE TABLE detalle_mantenimiento (
    id_detalle_mantenimiento INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_mantenimiento INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,

    cantidad NUMERIC(12, 2) NOT NULL,
    observacion TEXT,

    CONSTRAINT fk_detalle_mantenimiento_mantenimiento
        FOREIGN KEY (id_mantenimiento)
        REFERENCES mantenimiento(id_mantenimiento),

    CONSTRAINT fk_detalle_mantenimiento_producto
        FOREIGN KEY (id_producto)
        REFERENCES producto(id_producto),

    CONSTRAINT chk_detalle_mantenimiento_cantidad
        CHECK (cantidad > 0)
);
