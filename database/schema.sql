-- CAPECOMSIL: esquema completo para una base vacía.
-- Todas las columnas y restricciones se definen en su CREATE TABLE.
-- El orden respeta las dependencias de las claves foráneas.

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- =====================================================
-- TERMINAL
-- =====================================================

CREATE TABLE terminal (
    id_terminal INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(255),
    estado BOOLEAN NOT NULL DEFAULT TRUE
);

-- =====================================================
-- VEHICULO
-- =====================================================

CREATE TABLE vehiculo (
    imagen_url VARCHAR(2048),
    id_vehiculo INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    kilometraje_base NUMERIC(12,2) CHECK (kilometraje_base >= 0),
    fecha_inicio_control_km TIMESTAMP,
    CONSTRAINT vehiculo_inicio_control CHECK (
        (kilometraje_base IS NULL) = (fecha_inicio_control_km IS NULL)
    ),
    placa VARCHAR(20) NOT NULL UNIQUE,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    anio INTEGER,
    capacidad_galones NUMERIC(12, 2) NOT NULL,
    estado BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT chk_vehiculo_capacidad
        CHECK (capacidad_galones > 0),

    CONSTRAINT chk_vehiculo_anio
        CHECK (anio IS NULL OR anio > 0)
);

-- =====================================================
-- CHOFER
-- =====================================================

CREATE TABLE chofer (
    imagen_url VARCHAR(2048),
    id_chofer INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    cedula VARCHAR(20) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    tipo_remuneracion VARCHAR(50) NOT NULL,
    estado BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT chk_chofer_tipo_remuneracion
        CHECK (tipo_remuneracion IN ('DIARIO_FIJO', 'DIA_TRABAJADO'))
);

-- =====================================================
-- GASOLINERA
-- =====================================================

CREATE TABLE gasolinera (
    id_gasolinera INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    ruc VARCHAR(20) UNIQUE,
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    correo VARCHAR(150),
    representante_legal VARCHAR(150),
    agente_retencion BOOLEAN NOT NULL DEFAULT FALSE,
    estado BOOLEAN NOT NULL DEFAULT TRUE
);

-- =====================================================
-- PROVEEDOR
-- =====================================================

CREATE TABLE proveedor (
    id_proveedor INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    ruc VARCHAR(20) UNIQUE,
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    correo VARCHAR(150),
    estado BOOLEAN NOT NULL DEFAULT TRUE
);

-- =====================================================
-- CATEGORIA_PRODUCTO
-- =====================================================

CREATE TABLE categoria_producto (
    es_llanta BOOLEAN NOT NULL DEFAULT FALSE,
    id_categoria INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    estado BOOLEAN NOT NULL DEFAULT TRUE
);

-- =====================================================
-- PRODUCTO_TRANSPORTADO
-- =====================================================

CREATE TABLE producto_transportado (
    id_producto_transportado INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    unidad_medida VARCHAR(30) NOT NULL,
    estado BOOLEAN NOT NULL DEFAULT TRUE
);

-- =====================================================
-- PRODUCTO
-- =====================================================

CREATE TABLE producto (
    condicion_llanta VARCHAR(20),
    CONSTRAINT chk_producto_condicion_llanta CHECK (condicion_llanta IN ('NUEVA', 'REENCAUCHADA')),
    imagen_url VARCHAR(2048),
    id_producto INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_categoria INTEGER NOT NULL,

    nombre VARCHAR(150) NOT NULL,
    medida VARCHAR(50),
    modelo VARCHAR(100),
    marca VARCHAR(100),
    descripcion TEXT,
    unidad_medida VARCHAR(30) NOT NULL,
    stock_minimo NUMERIC(12, 2) NOT NULL DEFAULT 0,
    estado BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_producto_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES categoria_producto(id_categoria),

    CONSTRAINT chk_producto_stock_minimo
        CHECK (stock_minimo >= 0)
);

-- =====================================================
-- TARIFA
-- =====================================================

CREATE TABLE tarifa (
    id_tarifa INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_gasolinera INTEGER NOT NULL,
    id_terminal INTEGER NOT NULL,
    valor_por_galon NUMERIC(12, 4) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    estado BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_tarifa_gasolinera
        FOREIGN KEY (id_gasolinera)
        REFERENCES gasolinera(id_gasolinera),

    CONSTRAINT fk_tarifa_terminal
        FOREIGN KEY (id_terminal)
        REFERENCES terminal(id_terminal),

    CONSTRAINT chk_tarifa_valor
        CHECK (valor_por_galon >= 0),

    CONSTRAINT chk_tarifa_fechas
        CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),

    CONSTRAINT tarifa_sin_solapamientos
    EXCLUDE USING gist (
        id_gasolinera WITH =,
        id_terminal WITH =,
        daterange(fecha_inicio, fecha_fin, '[]') WITH &&
    )
);

-- =====================================================
-- LIQUIDACION
-- =====================================================

CREATE TABLE liquidacion (
    id_liquidacion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_gasolinera INTEGER NOT NULL,

    fecha_generacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_limite_confirmacion DATE,
    fecha_confirmacion TIMESTAMP,
    fecha_envio TIMESTAMP,
    fecha_anulacion TIMESTAMP,
    motivo_anulacion VARCHAR(150),

    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,

    total_galones NUMERIC(14, 2) NOT NULL DEFAULT 0,
    valor_transporte NUMERIC(14, 2) NOT NULL DEFAULT 0,
    retencion NUMERIC(14, 2) NOT NULL DEFAULT 0,
    recargo NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_liquidacion NUMERIC(14, 2) NOT NULL DEFAULT 0,

    estado VARCHAR(30) NOT NULL DEFAULT 'BORRADOR',
    observacion TEXT,

    CONSTRAINT liquidacion_estado CHECK (estado IN ('BORRADOR','ENVIADA','CONFIRMADA','ANULADA')),
    CONSTRAINT liquidacion_fechas CHECK (
        (estado='BORRADOR' AND fecha_envio IS NULL AND fecha_confirmacion IS NULL AND fecha_anulacion IS NULL AND motivo_anulacion IS NULL)
        OR (estado='ENVIADA' AND fecha_envio IS NOT NULL AND fecha_confirmacion IS NULL AND fecha_anulacion IS NULL AND motivo_anulacion IS NULL)
        OR (estado='CONFIRMADA' AND fecha_envio IS NOT NULL AND fecha_confirmacion IS NOT NULL AND fecha_anulacion IS NULL AND motivo_anulacion IS NULL)
        OR (estado='ANULADA' AND fecha_anulacion IS NOT NULL AND motivo_anulacion IS NOT NULL AND btrim(motivo_anulacion)<>'')
    ),
    CONSTRAINT liquidacion_orden_fechas CHECK (
        (fecha_confirmacion IS NULL OR (fecha_envio IS NOT NULL AND fecha_confirmacion>=fecha_envio))
        AND (fecha_anulacion IS NULL OR (fecha_anulacion>=COALESCE(fecha_confirmacion,fecha_envio,fecha_generacion)))
    ),

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
-- VIAJE
-- =====================================================

CREATE TABLE viaje (
    id_viaje INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_vehiculo INTEGER NOT NULL,
    id_chofer INTEGER NOT NULL,

    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    CONSTRAINT viaje_horario CHECK (fecha_fin > fecha_inicio AND fecha_fin::date = fecha_inicio::date),
    estado VARCHAR(30) NOT NULL DEFAULT 'REGISTRADO',
    fecha_anulacion TIMESTAMP,
    motivo_anulacion VARCHAR(150),
    CONSTRAINT chk_viaje_estado CHECK (estado IN ('REGISTRADO', 'ANULADO')),
    CONSTRAINT horario_viaje_vehiculo EXCLUDE USING gist
        (id_vehiculo WITH =, tsrange(fecha_inicio,fecha_fin,'[)') WITH &&) WHERE (estado='REGISTRADO'),
    CONSTRAINT horario_viaje_chofer EXCLUDE USING gist
        (id_chofer WITH =, tsrange(fecha_inicio,fecha_fin,'[)') WITH &&) WHERE (estado='REGISTRADO'),

    CONSTRAINT fk_viaje_vehiculo
        FOREIGN KEY (id_vehiculo)
        REFERENCES vehiculo(id_vehiculo),

    CONSTRAINT fk_viaje_chofer
        FOREIGN KEY (id_chofer)
        REFERENCES chofer(id_chofer)
);

-- =====================================================
-- DETALLE_VIAJE
-- =====================================================

CREATE TABLE trayecto (
    id_trayecto INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL CHECK (btrim(nombre) <> ''),
    estado BOOLEAN NOT NULL DEFAULT TRUE,
    id_terminal_origen INTEGER REFERENCES terminal(id_terminal),
    id_gasolinera_origen INTEGER REFERENCES gasolinera(id_gasolinera),
    id_terminal_destino INTEGER REFERENCES terminal(id_terminal),
    id_gasolinera_destino INTEGER REFERENCES gasolinera(id_gasolinera),
    kilometros NUMERIC(10,2) NOT NULL CHECK (kilometros > 0),
    observacion TEXT,
    CONSTRAINT chk_trayecto_origen CHECK (num_nonnulls(id_terminal_origen, id_gasolinera_origen) = 1),
    CONSTRAINT chk_trayecto_destino CHECK (num_nonnulls(id_terminal_destino, id_gasolinera_destino) = 1),
    CONSTRAINT chk_trayecto_distinto CHECK (
        id_terminal_origen IS DISTINCT FROM id_terminal_destino
        OR id_gasolinera_origen IS DISTINCT FROM id_gasolinera_destino
    )
);


-- Configuraciones con vigencia para costos automáticos.
CREATE TABLE configuracion_combustible (
    id_configuracion_combustible INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    consumo_galones_km NUMERIC(12,6) NOT NULL CHECK (consumo_galones_km > 0),
    precio_por_galon NUMERIC(12,4) NOT NULL CHECK (precio_por_galon > 0),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    observacion TEXT,
    CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
    EXCLUDE USING gist (daterange(fecha_inicio,fecha_fin,'[]') WITH &&)
);

CREATE TABLE configuracion_viatico (
    id_configuracion_viatico INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    importe_diario NUMERIC(12,2) NOT NULL CHECK (importe_diario > 0),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    observacion TEXT,
    CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
    EXCLUDE USING gist (daterange(fecha_inicio,fecha_fin,'[]') WITH &&)
);

CREATE TABLE viatico_chofer (
    id_viatico_chofer INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_chofer INTEGER NOT NULL REFERENCES chofer(id_chofer),
    id_configuracion_viatico INTEGER NOT NULL REFERENCES configuracion_viatico(id_configuracion_viatico),
    fecha DATE NOT NULL,
    importe_diario_aplicado NUMERIC(12,2) NOT NULL CHECK (importe_diario_aplicado > 0),
    total NUMERIC(12,2) NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_chofer,fecha),
    CHECK (total = 0 OR total = importe_diario_aplicado)
);

CREATE TABLE configuracion_peaje_trayecto (
    id_configuracion_peaje_trayecto INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_trayecto INTEGER NOT NULL REFERENCES trayecto(id_trayecto),
    importe NUMERIC(12,2) NOT NULL CHECK (importe >= 0),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    observacion TEXT,
    UNIQUE (id_configuracion_peaje_trayecto,id_trayecto),
    CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
    EXCLUDE USING gist (id_trayecto WITH =, daterange(fecha_inicio,fecha_fin,'[]') WITH &&)
);

CREATE TABLE tramo_viaje (
    id_tramo_viaje INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_viaje INTEGER NOT NULL REFERENCES viaje(id_viaje),
    id_trayecto INTEGER NOT NULL REFERENCES trayecto(id_trayecto),
    id_configuracion_peaje_trayecto INTEGER NOT NULL,
    peaje_aplicado NUMERIC(12,2) NOT NULL CHECK (peaje_aplicado >= 0),
    FOREIGN KEY (id_configuracion_peaje_trayecto,id_trayecto)
        REFERENCES configuracion_peaje_trayecto(id_configuracion_peaje_trayecto,id_trayecto),
    orden INTEGER NOT NULL CHECK (orden > 0),
    kilometros NUMERIC(10,2) NOT NULL CHECK (kilometros > 0),
    observacion TEXT,
    CONSTRAINT uq_tramo_viaje_orden UNIQUE (id_viaje, orden) DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX idx_tramo_trayecto ON tramo_viaje(id_trayecto);

CREATE TABLE detalle_viaje (
    id_detalle_viaje INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_viaje INTEGER NOT NULL,
    id_tarifa INTEGER NOT NULL,
    id_producto_transportado INTEGER NOT NULL,
    CONSTRAINT fk_detalle_viaje_tarifa FOREIGN KEY (id_tarifa) REFERENCES tarifa(id_tarifa),

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

-- =====================================================
-- COSTO_VIAJE
-- =====================================================

CREATE TABLE detalle_liquidacion (
    id_detalle_liquidacion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_liquidacion INTEGER NOT NULL REFERENCES liquidacion(id_liquidacion),
    id_detalle_viaje INTEGER NOT NULL REFERENCES detalle_viaje(id_detalle_viaje),
    galones NUMERIC(14,2) NOT NULL CHECK (galones>0),
    tarifa_aplicada NUMERIC(12,4) NOT NULL CHECK (tarifa_aplicada>=0),
    valor_transporte NUMERIC(14,2) NOT NULL CHECK (valor_transporte>=0),
    CONSTRAINT detalle_liquidacion_entrega_unica UNIQUE(id_liquidacion,id_detalle_viaje)
);
CREATE INDEX idx_detalle_liquidacion_entrega ON detalle_liquidacion(id_detalle_viaje);

-- Remuneración diaria y sus referencias históricas.
CREATE TABLE configuracion_remuneracion (
    id_configuracion_remuneracion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    importe_diario NUMERIC(12,2) NOT NULL CHECK (importe_diario > 0),
    adicional_dia_especial NUMERIC(12,2) NOT NULL CHECK (adicional_dia_especial >= 0),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    observacion TEXT,
    CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
    CONSTRAINT remuneracion_vigencias EXCLUDE USING gist (daterange(fecha_inicio,fecha_fin,'[]') WITH &&)
);

CREATE TABLE feriado (
    id_feriado INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha DATE NOT NULL UNIQUE,
    descripcion VARCHAR(150) NOT NULL CHECK (btrim(descripcion) <> ''),
    observacion TEXT
);

CREATE TABLE remuneracion_chofer (
    id_remuneracion_chofer INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_chofer INTEGER NOT NULL REFERENCES chofer(id_chofer),
    id_configuracion_remuneracion INTEGER NOT NULL REFERENCES configuracion_remuneracion(id_configuracion_remuneracion),
    id_feriado INTEGER REFERENCES feriado(id_feriado),
    fecha DATE NOT NULL,
    tipo_remuneracion_aplicado VARCHAR(20) NOT NULL CHECK (tipo_remuneracion_aplicado IN ('DIARIO_FIJO','DIA_TRABAJADO')),
    trabajo_realizado BOOLEAN NOT NULL,
    es_domingo BOOLEAN NOT NULL,
    importe_base NUMERIC(12,2) NOT NULL CHECK (importe_base >= 0),
    importe_adicional NUMERIC(12,2) NOT NULL CHECK (importe_adicional >= 0),
    total NUMERIC(12,2) NOT NULL CHECK (total = importe_base + importe_adicional),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observacion TEXT,
    UNIQUE (id_chofer,fecha)
);


CREATE TABLE costo_viaje (
    id_costo INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_viaje INTEGER NOT NULL,
    id_remuneracion_chofer INTEGER REFERENCES remuneracion_chofer(id_remuneracion_chofer),
    id_viatico_chofer INTEGER REFERENCES viatico_chofer(id_viatico_chofer),
    id_configuracion_combustible INTEGER REFERENCES configuracion_combustible(id_configuracion_combustible),
    kilometros_aplicados NUMERIC(12,2),
    consumo_galones_km_aplicado NUMERIC(12,6),
    precio_por_galon_aplicado NUMERIC(12,4),
    galones_estimados NUMERIC(18,6),
    UNIQUE (id_viaje,id_remuneracion_chofer),
    UNIQUE (id_viaje,tipo_costo),
    CHECK (tipo_costo IN ('CHOFER','VIATICO','COMBUSTIBLE','PEAJE')),
    CHECK ((tipo_costo='VIATICO') = (id_viatico_chofer IS NOT NULL)),
    CHECK (
        (tipo_costo='COMBUSTIBLE'
            AND id_configuracion_combustible IS NOT NULL
            AND kilometros_aplicados IS NOT NULL AND kilometros_aplicados > 0
            AND consumo_galones_km_aplicado IS NOT NULL AND consumo_galones_km_aplicado > 0
            AND precio_por_galon_aplicado IS NOT NULL AND precio_por_galon_aplicado > 0
            AND galones_estimados IS NOT NULL AND galones_estimados > 0)
        OR (tipo_costo<>'COMBUSTIBLE'
            AND num_nonnulls(id_configuracion_combustible,kilometros_aplicados,
                consumo_galones_km_aplicado,precio_por_galon_aplicado,galones_estimados)=0)
    ),
    CONSTRAINT remuneracion_costo_origen CHECK ((tipo_costo='CHOFER') = (id_remuneracion_chofer IS NOT NULL)),
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
-- FACTURA
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

-- =====================================================
-- PAGO
-- =====================================================

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
-- GASTO
-- =====================================================

CREATE TABLE gasto (
    id_gasto INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_viaje INTEGER,
    id_vehiculo INTEGER,
    id_proveedor INTEGER,

    id_viatico_chofer INTEGER REFERENCES viatico_chofer(id_viatico_chofer),
    estado VARCHAR(20) NOT NULL DEFAULT 'REGISTRADO' CHECK (estado IN ('REGISTRADO','ANULADO')),
    fecha_anulacion TIMESTAMP,
    motivo_anulacion VARCHAR(150),
    CHECK (
        (estado='REGISTRADO' AND fecha_anulacion IS NULL AND motivo_anulacion IS NULL)
        OR (estado='ANULADO' AND fecha_anulacion IS NOT NULL
            AND motivo_anulacion IS NOT NULL AND btrim(motivo_anulacion)<>'')
    ),
    CHECK (id_viatico_chofer IS NULL OR (tipo_gasto='VIATICO' AND id_viaje IS NULL)),
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
-- FACTURA_PROVEEDOR
-- =====================================================

CREATE TABLE factura_proveedor (
    id_factura_proveedor INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_proveedor INTEGER NOT NULL,

    numero_factura VARCHAR(50) NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE,
    subtotal NUMERIC(14, 2) NOT NULL,
    descuento_total NUMERIC(14, 2) NOT NULL DEFAULT 0,
    impuestos NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total NUMERIC(14, 2) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'REGISTRADA',
    fecha_anulacion TIMESTAMP,
    motivo_anulacion VARCHAR(150),
    CONSTRAINT chk_factura_proveedor_estado CHECK (estado IN ('REGISTRADA','ANULADA')),

    CONSTRAINT fk_factura_proveedor_proveedor
        FOREIGN KEY (id_proveedor)
        REFERENCES proveedor(id_proveedor),

    CONSTRAINT chk_factura_proveedor_monto
        CHECK (subtotal >= 0 AND descuento_total >= 0 AND impuestos >= 0 AND total = subtotal + impuestos),

    CONSTRAINT uq_factura_proveedor_numero
        UNIQUE (id_proveedor, numero_factura)
);

-- =====================================================
-- DETALLE_FACTURA_PROVEEDOR
-- =====================================================

CREATE TABLE detalle_factura_proveedor (
    id_detalle_factura_proveedor INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_factura_proveedor INTEGER NOT NULL,
    id_producto INTEGER,
    tipo_concepto VARCHAR(20) NOT NULL,
    descripcion TEXT NOT NULL,

    cantidad NUMERIC(12, 2) NOT NULL,
    precio_unitario NUMERIC(12, 2) NOT NULL,
    descuento NUMERIC(14, 2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(14, 2) NOT NULL,
    porcentaje_impuesto NUMERIC(7, 4) NOT NULL,
    impuesto NUMERIC(14, 2) NOT NULL,
    total_linea NUMERIC(14, 2) NOT NULL,

    CONSTRAINT chk_detalle_factura_concepto
        CHECK ((tipo_concepto = 'PRODUCTO' AND id_producto IS NOT NULL)
            OR (tipo_concepto = 'SERVICIO' AND id_producto IS NULL)),
    CONSTRAINT chk_detalle_factura_descripcion CHECK (btrim(descripcion) <> ''),

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
            AND descuento >= 0
            AND descuento <= round(cantidad * precio_unitario, 2)
            AND subtotal = round(cantidad * precio_unitario, 2) - descuento
            AND porcentaje_impuesto BETWEEN 0 AND 100
            AND impuesto = round(subtotal * porcentaje_impuesto / 100, 2)
            AND total_linea = subtotal + impuesto
        )
);

-- =====================================================
-- PAGO_PROVEEDOR
-- =====================================================

CREATE TABLE pago_proveedor (
    id_pago_proveedor INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_factura_proveedor INTEGER NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'REGISTRADO',
    fecha_anulacion TIMESTAMP,
    motivo_anulacion VARCHAR(150),
    CONSTRAINT chk_pago_proveedor_estado CHECK (estado IN ('REGISTRADO','ANULADO')),
    CONSTRAINT chk_pago_proveedor_anulacion CHECK (
        (estado='REGISTRADO' AND fecha_anulacion IS NULL AND motivo_anulacion IS NULL)
        OR (estado='ANULADO' AND fecha_anulacion IS NOT NULL AND motivo_anulacion IS NOT NULL AND btrim(motivo_anulacion) <> '')
    ),

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
-- MANTENIMIENTO
-- =====================================================

CREATE INDEX idx_pago_proveedor_factura ON pago_proveedor(id_factura_proveedor);

CREATE TABLE mantenimiento (
    id_mantenimiento INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    estado VARCHAR(20) NOT NULL DEFAULT 'REGISTRADO' CHECK (estado IN ('REGISTRADO', 'ANULADO')),
    fecha_anulacion TIMESTAMP,
    motivo_anulacion VARCHAR(150),
    id_vehiculo INTEGER NOT NULL,
    id_proveedor INTEGER,

    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP,
    CHECK (fecha_fin IS NULL OR fecha_fin > fecha_inicio),
    CONSTRAINT horario_mantenimiento EXCLUDE USING gist
        (id_vehiculo WITH =, tsrange(fecha_inicio,fecha_fin,'[)') WITH &&) WHERE (estado='REGISTRADO'),
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

-- =====================================================
-- PLANES DE MANTENIMIENTO Y ABASTECIMIENTOS
-- =====================================================

-- Planes independientes por vehículo; no generan consumos de inventario.
CREATE TABLE plan_mantenimiento_vehiculo (
    id_plan_mantenimiento_vehiculo INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_vehiculo INTEGER NOT NULL REFERENCES vehiculo(id_vehiculo),
    nombre VARCHAR(150) NOT NULL CHECK (btrim(nombre) <> ''),
    intervalo_km NUMERIC(12,2) NOT NULL CHECK (intervalo_km > 0),
    kilometraje_referencia_inicial NUMERIC(12,2) NOT NULL CHECK (kilometraje_referencia_inicial >= 0),
    anticipacion_aviso_km NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (anticipacion_aviso_km >= 0),
    estado BOOLEAN NOT NULL DEFAULT TRUE,
    observacion TEXT
);
CREATE INDEX idx_plan_mantenimiento_vehiculo ON plan_mantenimiento_vehiculo(id_vehiculo);

CREATE TABLE cumplimiento_plan_mantenimiento (
    id_cumplimiento_plan_mantenimiento INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_mantenimiento INTEGER NOT NULL REFERENCES mantenimiento(id_mantenimiento),
    id_plan_mantenimiento_vehiculo INTEGER NOT NULL REFERENCES plan_mantenimiento_vehiculo(id_plan_mantenimiento_vehiculo),
    kilometraje_aplicado NUMERIC(12,2) NOT NULL CHECK (kilometraje_aplicado >= 0),
    UNIQUE (id_mantenimiento,id_plan_mantenimiento_vehiculo)
);
CREATE INDEX idx_cumplimiento_plan ON cumplimiento_plan_mantenimiento(id_plan_mantenimiento_vehiculo);

-- El importe, comprobante y estado de anulación pertenecen al gasto asociado.
-- Un gasto puede respaldar una sola carga; no se duplican importes aquí.
CREATE TABLE abastecimiento_combustible (
    id_abastecimiento_combustible INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_vehiculo INTEGER NOT NULL REFERENCES vehiculo(id_vehiculo),
    id_gasto INTEGER NOT NULL UNIQUE REFERENCES gasto(id_gasto),
    fecha_hora TIMESTAMP NOT NULL,
    kilometraje_odometro NUMERIC(12,2) NOT NULL CHECK (kilometraje_odometro >= 0),
    galones NUMERIC(12,4) NOT NULL CHECK (galones > 0),
    precio_por_galon NUMERIC(12,4) NOT NULL CHECK (precio_por_galon > 0),
    tanque_lleno BOOLEAN NOT NULL,
    observacion TEXT
);
CREATE INDEX idx_abastecimiento_vehiculo_fecha ON abastecimiento_combustible(id_vehiculo,fecha_hora);

-- =====================================================
-- DETALLE_MANTENIMIENTO
-- =====================================================
CREATE TABLE detalle_mantenimiento (
    id_detalle_mantenimiento INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_mantenimiento INTEGER NOT NULL,
    id_producto INTEGER,
    origen_producto VARCHAR(20) NOT NULL DEFAULT 'INVENTARIO',
    descripcion_producto VARCHAR(200),
    CONSTRAINT chk_detalle_mantenimiento_origen CHECK (
        (origen_producto = 'INVENTARIO' AND id_producto IS NOT NULL)
        OR (origen_producto = 'EXTERNO' AND id_producto IS NULL
            AND descripcion_producto IS NOT NULL AND btrim(descripcion_producto) <> '')
    ),


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

-- =====================================================
-- RECEPCION_COMPRA
-- =====================================================

CREATE TABLE recepcion_compra (
    id_recepcion_compra INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha_anulacion TIMESTAMP,
    motivo_anulacion VARCHAR(150),
    id_factura_proveedor INTEGER NOT NULL,
    fecha_recepcion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    numero_comprobante VARCHAR(100),
    observacion TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'REGISTRADA',

    CONSTRAINT fk_recepcion_factura_proveedor
        FOREIGN KEY (id_factura_proveedor)
        REFERENCES factura_proveedor(id_factura_proveedor),
    CONSTRAINT chk_recepcion_estado
        CHECK (estado IN ('REGISTRADA', 'ANULADA'))
);

-- =====================================================
-- DETALLE_RECEPCION_COMPRA
-- =====================================================

CREATE TABLE detalle_recepcion_compra (
    id_detalle_recepcion_compra INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_recepcion_compra INTEGER NOT NULL,
    id_detalle_factura_proveedor INTEGER NOT NULL,
    cantidad_recibida NUMERIC(12, 2) NOT NULL,
    observacion TEXT,

    CONSTRAINT fk_detalle_recepcion_cabecera
        FOREIGN KEY (id_recepcion_compra)
        REFERENCES recepcion_compra(id_recepcion_compra),
    CONSTRAINT fk_detalle_recepcion_factura
        FOREIGN KEY (id_detalle_factura_proveedor)
        REFERENCES detalle_factura_proveedor(id_detalle_factura_proveedor),
    CONSTRAINT uq_recepcion_detalle_factura
        UNIQUE (id_recepcion_compra, id_detalle_factura_proveedor),
    CONSTRAINT chk_detalle_recepcion_cantidad
        CHECK (cantidad_recibida > 0)
);

-- =====================================================
-- MOVIMIENTO_INVENTARIO
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
        CHECK (
            (tipo_movimiento IN ('ENTRADA', 'SALIDA') AND cantidad > 0)
            OR (tipo_movimiento = 'AJUSTE' AND cantidad <> 0)
        ),

    id_detalle_recepcion_compra INTEGER,
    id_detalle_mantenimiento INTEGER,
    id_movimiento_revertido INTEGER,
    CONSTRAINT fk_movimiento_recepcion
        FOREIGN KEY (id_detalle_recepcion_compra)
        REFERENCES detalle_recepcion_compra(id_detalle_recepcion_compra),
    CONSTRAINT fk_movimiento_mantenimiento
        FOREIGN KEY (id_detalle_mantenimiento)
        REFERENCES detalle_mantenimiento(id_detalle_mantenimiento),
    CONSTRAINT fk_movimiento_revertido
        FOREIGN KEY (id_movimiento_revertido)
        REFERENCES movimiento_inventario(id_movimiento),
    CONSTRAINT uq_movimiento_recepcion UNIQUE (id_detalle_recepcion_compra),
    CONSTRAINT uq_movimiento_mantenimiento UNIQUE (id_detalle_mantenimiento),
    CONSTRAINT uq_movimiento_revertido UNIQUE (id_movimiento_revertido),
    CONSTRAINT chk_movimiento_un_origen
        CHECK (num_nonnulls(id_detalle_recepcion_compra, id_detalle_mantenimiento, id_movimiento_revertido) <= 1),
    CONSTRAINT chk_movimiento_origen_tipo
        CHECK (
            (id_detalle_recepcion_compra IS NULL OR tipo_movimiento = 'ENTRADA')
            AND (id_detalle_mantenimiento IS NULL OR tipo_movimiento = 'SALIDA')
        ),
    CONSTRAINT chk_movimiento_no_autorreversion
        CHECK (id_movimiento_revertido IS NULL OR id_movimiento_revertido <> id_movimiento)
);

CREATE INDEX idx_recepcion_factura ON recepcion_compra(id_factura_proveedor);
CREATE INDEX idx_detalle_recepcion_factura ON detalle_recepcion_compra(id_detalle_factura_proveedor);

-- FUNCIONES Y TRIGGERS DE PROTECCIÓN DEL HISTORIAL

CREATE FUNCTION proteger_historial_tarifa() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM detalle_viaje WHERE id_tarifa = OLD.id_tarifa) THEN
        IF NEW.id_gasolinera IS DISTINCT FROM OLD.id_gasolinera
            OR NEW.id_terminal IS DISTINCT FROM OLD.id_terminal
            OR NEW.valor_por_galon IS DISTINCT FROM OLD.valor_por_galon
            OR EXISTS (
                SELECT 1 FROM detalle_viaje d JOIN viaje v USING (id_viaje)
                WHERE d.id_tarifa = OLD.id_tarifa
                AND (v.fecha_inicio::date < NEW.fecha_inicio OR v.fecha_inicio::date > NEW.fecha_fin)
            ) THEN
            RAISE EXCEPTION 'La modificación altera el historial de viajes'
                USING ERRCODE = '23514', CONSTRAINT = 'tarifa_historial';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER tarifa_proteger_historial BEFORE UPDATE ON tarifa
    FOR EACH ROW EXECUTE FUNCTION proteger_historial_tarifa();

-- Serializa entregas con cambios de fecha del viaje y cambios de tarifas.
CREATE FUNCTION validar_vigencia_tarifa_viaje() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE vigente tarifa%ROWTYPE;
        fecha_viaje DATE;
BEGIN
    SELECT fecha_inicio::date INTO fecha_viaje FROM viaje WHERE id_viaje=NEW.id_viaje FOR UPDATE;
    SELECT * INTO vigente FROM tarifa WHERE id_tarifa = NEW.id_tarifa FOR UPDATE;
    IF FOUND AND (fecha_viaje::date < vigente.fecha_inicio OR fecha_viaje::date > vigente.fecha_fin) THEN
        RAISE EXCEPTION 'La tarifa no cubre la fecha del viaje'
            USING ERRCODE = '23514', CONSTRAINT = 'viaje_tarifa_vigente';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER detalle_viaje_validar_tarifa BEFORE INSERT OR UPDATE OF id_tarifa, id_viaje ON detalle_viaje
    FOR EACH ROW EXECUTE FUNCTION validar_vigencia_tarifa_viaje();

CREATE FUNCTION validar_fecha_viaje() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE vigente tarifa%ROWTYPE;
BEGIN
    FOR vigente IN SELECT t.* FROM tarifa t
        WHERE t.id_tarifa IN (SELECT d.id_tarifa FROM detalle_viaje d WHERE d.id_viaje=NEW.id_viaje)
        ORDER BY t.id_tarifa FOR UPDATE
    LOOP
        IF NEW.fecha_inicio::date < vigente.fecha_inicio OR NEW.fecha_inicio::date > vigente.fecha_fin THEN
            RAISE EXCEPTION 'La tarifa no cubre la fecha del viaje'
                USING ERRCODE = '23514', CONSTRAINT = 'viaje_tarifa_vigente';
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER viaje_validar_fecha BEFORE UPDATE OF fecha_inicio ON viaje
    FOR EACH ROW EXECUTE FUNCTION validar_fecha_viaje();

CREATE INDEX idx_detalle_viaje_tarifa ON detalle_viaje(id_tarifa);
CREATE INDEX idx_detalle_viaje_viaje ON detalle_viaje(id_viaje);



CREATE FUNCTION validar_reglas_producto() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE categoria_estado BOOLEAN;
BEGIN
    IF TG_OP = 'INSERT' OR NEW.id_categoria IS DISTINCT FROM OLD.id_categoria THEN
        SELECT estado INTO categoria_estado FROM categoria_producto
            WHERE id_categoria = NEW.id_categoria FOR SHARE;
        IF FOUND AND categoria_estado IS NOT TRUE THEN
            RAISE EXCEPTION 'La categoría seleccionada debe estar activa'
                USING ERRCODE = '23514', CONSTRAINT = 'producto_categoria_activa';
        END IF;
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.unidad_medida IS DISTINCT FROM OLD.unidad_medida THEN
        IF EXISTS (SELECT 1 FROM detalle_factura_proveedor WHERE id_producto = OLD.id_producto)
            OR EXISTS (SELECT 1 FROM movimiento_inventario WHERE id_producto = OLD.id_producto)
            OR EXISTS (SELECT 1 FROM detalle_mantenimiento WHERE id_producto = OLD.id_producto) THEN
            RAISE EXCEPTION 'No se puede cambiar la unidad de un producto con historial'
                USING ERRCODE = '23514', CONSTRAINT = 'producto_unidad_historial';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER producto_validar_reglas BEFORE INSERT OR UPDATE ON producto
    FOR EACH ROW EXECUTE FUNCTION validar_reglas_producto();

-- Serializa la primera operación histórica con cambios de unidad del producto.
-- Las FK existentes bloquean su eliminación si hay historial.
CREATE FUNCTION bloquear_producto_historial() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    PERFORM 1 FROM producto WHERE id_producto = NEW.id_producto FOR UPDATE;
    RETURN NEW;
END;
$$;

CREATE TRIGGER compra_bloquear_producto BEFORE INSERT OR UPDATE OF id_producto ON detalle_factura_proveedor
    FOR EACH ROW EXECUTE FUNCTION bloquear_producto_historial();
CREATE TRIGGER movimiento_bloquear_producto BEFORE INSERT OR UPDATE OF id_producto ON movimiento_inventario
    FOR EACH ROW EXECUTE FUNCTION bloquear_producto_historial();
CREATE TRIGGER mantenimiento_bloquear_producto BEFORE INSERT OR UPDATE OF id_producto ON detalle_mantenimiento
    FOR EACH ROW EXECUTE FUNCTION bloquear_producto_historial();

-- Reglas diferidas: permiten guardar cabecera, entregas y tramos en una transacción.
CREATE FUNCTION bloquear_recorrido_viaje() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP <> 'INSERT' THEN
        PERFORM 1 FROM viaje WHERE id_viaje = OLD.id_viaje FOR UPDATE;
    END IF;
    IF TG_OP <> 'DELETE' THEN
        PERFORM 1 FROM viaje WHERE id_viaje = NEW.id_viaje FOR UPDATE;
        RETURN NEW;
    END IF;
    RETURN OLD;
END;
$$;
CREATE TRIGGER tramo_bloquear_viaje BEFORE INSERT OR UPDATE OR DELETE ON tramo_viaje
    FOR EACH ROW EXECUTE FUNCTION bloquear_recorrido_viaje();

CREATE FUNCTION validar_recorrido_viaje() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE ids INTEGER[]; viaje_id INTEGER; total INTEGER; ultimo INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN ids := ARRAY[NEW.id_viaje];
    ELSIF TG_OP = 'DELETE' THEN ids := ARRAY[OLD.id_viaje];
    ELSE ids := ARRAY[OLD.id_viaje, NEW.id_viaje]; END IF;
    FOREACH viaje_id IN ARRAY ids LOOP
        IF NOT EXISTS (SELECT 1 FROM viaje WHERE id_viaje = viaje_id) THEN CONTINUE; END IF;
        SELECT count(*), max(orden) INTO total, ultimo FROM (SELECT t.*, c.id_terminal_origen, c.id_gasolinera_origen, c.id_terminal_destino, c.id_gasolinera_destino FROM tramo_viaje t JOIN trayecto c USING (id_trayecto)) recorrido WHERE id_viaje = viaje_id;
        IF total = 0 OR total <> ultimo OR NOT EXISTS (
            SELECT 1 FROM (SELECT t.*, c.id_terminal_origen, c.id_gasolinera_origen, c.id_terminal_destino, c.id_gasolinera_destino FROM tramo_viaje t JOIN trayecto c USING (id_trayecto)) recorrido WHERE id_viaje = viaje_id AND orden = 1
        ) THEN
            RAISE EXCEPTION 'El recorrido debe contener tramos consecutivos desde 1'
                USING ERRCODE = '23514', CONSTRAINT = 'viaje_recorrido';
        END IF;
        IF EXISTS (
            SELECT 1 FROM (SELECT t.*, c.id_terminal_origen, c.id_gasolinera_origen, c.id_terminal_destino, c.id_gasolinera_destino FROM tramo_viaje t JOIN trayecto c USING (id_trayecto)) a JOIN (SELECT t.*, c.id_terminal_origen, c.id_gasolinera_origen, c.id_terminal_destino, c.id_gasolinera_destino FROM tramo_viaje t JOIN trayecto c USING (id_trayecto)) b
                ON b.id_viaje = a.id_viaje AND b.orden = a.orden + 1
            WHERE a.id_viaje = viaje_id AND (
                a.id_terminal_destino IS DISTINCT FROM b.id_terminal_origen
                OR a.id_gasolinera_destino IS DISTINCT FROM b.id_gasolinera_origen)
        ) THEN
            RAISE EXCEPTION 'Los tramos del viaje no son continuos'
                USING ERRCODE = '23514', CONSTRAINT = 'viaje_recorrido';
        END IF;
        IF EXISTS (
            SELECT 1 FROM detalle_viaje d JOIN tarifa t USING(id_tarifa)
            WHERE d.id_viaje = viaje_id AND NOT EXISTS (
                SELECT 1 FROM (SELECT t.*, c.id_terminal_origen, c.id_gasolinera_origen, c.id_terminal_destino, c.id_gasolinera_destino FROM tramo_viaje t JOIN trayecto c USING (id_trayecto)) carga JOIN (SELECT t.*, c.id_terminal_origen, c.id_gasolinera_origen, c.id_terminal_destino, c.id_gasolinera_destino FROM tramo_viaje t JOIN trayecto c USING (id_trayecto)) entrega
                    ON entrega.id_viaje = carga.id_viaje
                WHERE carga.id_viaje = viaje_id AND (
                    (carga.id_terminal_origen = t.id_terminal AND carga.orden <= entrega.orden)
                    OR (carga.id_terminal_destino = t.id_terminal AND carga.orden < entrega.orden))
                    AND entrega.id_gasolinera_destino = t.id_gasolinera
            )
        ) THEN
            RAISE EXCEPTION 'El recorrido debe visitar el terminal antes de la gasolinera de cada entrega'
                USING ERRCODE = '23514', CONSTRAINT = 'viaje_recorrido_entregas';
        END IF;
    END LOOP;
    RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER viaje_validar_recorrido AFTER INSERT OR UPDATE ON viaje
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validar_recorrido_viaje();
CREATE CONSTRAINT TRIGGER tramo_validar_recorrido AFTER INSERT OR UPDATE OR DELETE ON tramo_viaje
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validar_recorrido_viaje();
CREATE CONSTRAINT TRIGGER entrega_validar_recorrido AFTER INSERT OR UPDATE OR DELETE ON detalle_viaje
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validar_recorrido_viaje();

CREATE FUNCTION validar_condicion_llanta() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE requiere BOOLEAN;
BEGIN
    SELECT es_llanta INTO requiere FROM categoria_producto WHERE id_categoria = NEW.id_categoria FOR SHARE;
    IF (requiere AND NEW.condicion_llanta IS NULL)
        OR (NOT requiere AND NEW.condicion_llanta IS NOT NULL) THEN
        RAISE EXCEPTION 'La condición NUEVA o REENCAUCHADA corresponde únicamente a productos de categoría llanta'
            USING ERRCODE = '23514', CONSTRAINT = 'producto_condicion_categoria';
    END IF;
    IF TG_OP = 'UPDATE' AND (NEW.condicion_llanta IS DISTINCT FROM OLD.condicion_llanta
        OR NEW.medida IS DISTINCT FROM OLD.medida) AND (
        EXISTS (SELECT 1 FROM movimiento_inventario WHERE id_producto = OLD.id_producto)
        OR EXISTS (SELECT 1 FROM detalle_factura_proveedor WHERE id_producto = OLD.id_producto)
        OR EXISTS (SELECT 1 FROM detalle_mantenimiento WHERE id_producto = OLD.id_producto)
    ) THEN
        RAISE EXCEPTION 'No se puede cambiar medida o condición de un producto con historial'
            USING ERRCODE = '23514', CONSTRAINT = 'producto_presentacion_historial';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER producto_validar_condicion BEFORE INSERT OR UPDATE ON producto
    FOR EACH ROW EXECUTE FUNCTION validar_condicion_llanta();

CREATE FUNCTION proteger_tipo_categoria() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.es_llanta IS DISTINCT FROM OLD.es_llanta
        AND EXISTS (SELECT 1 FROM producto WHERE id_categoria = OLD.id_categoria) THEN
        RAISE EXCEPTION 'No se puede cambiar es_llanta en una categoría con productos'
            USING ERRCODE = '23514', CONSTRAINT = 'categoria_tipo_historial';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER categoria_proteger_tipo BEFORE UPDATE ON categoria_producto
    FOR EACH ROW EXECUTE FUNCTION proteger_tipo_categoria();

CREATE FUNCTION validar_movimiento_material() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE material detalle_mantenimiento%ROWTYPE;
BEGIN
    IF NEW.id_detalle_mantenimiento IS NOT NULL THEN
        SELECT * INTO material FROM detalle_mantenimiento
            WHERE id_detalle_mantenimiento = NEW.id_detalle_mantenimiento FOR UPDATE;
        IF FOUND AND (material.origen_producto <> 'INVENTARIO'
            OR material.id_producto IS DISTINCT FROM NEW.id_producto OR material.cantidad <> NEW.cantidad) THEN
            RAISE EXCEPTION 'La salida debe corresponder al producto y cantidad del material de inventario'
                USING ERRCODE = '23514', CONSTRAINT = 'movimiento_material';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER movimiento_validar_material BEFORE INSERT OR UPDATE ON movimiento_inventario
    FOR EACH ROW EXECUTE FUNCTION validar_movimiento_material();

CREATE FUNCTION proteger_material_consumido() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF (NEW.origen_producto IS DISTINCT FROM OLD.origen_producto
        OR NEW.id_producto IS DISTINCT FROM OLD.id_producto OR NEW.cantidad IS DISTINCT FROM OLD.cantidad)
        AND EXISTS (SELECT 1 FROM movimiento_inventario WHERE id_detalle_mantenimiento = OLD.id_detalle_mantenimiento) THEN
        RAISE EXCEPTION 'No se puede modificar un material que ya generó movimientos'
            USING ERRCODE = '23514', CONSTRAINT = 'material_historial';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER mantenimiento_proteger_material BEFORE UPDATE ON detalle_mantenimiento
    FOR EACH ROW EXECUTE FUNCTION proteger_material_consumido();

-- El catálogo puede cambiar sus kilómetros para nuevos viajes, nunca los extremos usados.
CREATE FUNCTION proteger_historial_trayecto() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF (NEW.id_terminal_origen IS DISTINCT FROM OLD.id_terminal_origen
        OR NEW.id_gasolinera_origen IS DISTINCT FROM OLD.id_gasolinera_origen
        OR NEW.id_terminal_destino IS DISTINCT FROM OLD.id_terminal_destino
        OR NEW.id_gasolinera_destino IS DISTINCT FROM OLD.id_gasolinera_destino)
        AND EXISTS (SELECT 1 FROM tramo_viaje WHERE id_trayecto=OLD.id_trayecto) THEN
        RAISE EXCEPTION 'No se pueden cambiar las ubicaciones de un trayecto utilizado'
            USING ERRCODE='23514', CONSTRAINT='trayecto_historial';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER trayecto_proteger_historial BEFORE UPDATE ON trayecto
    FOR EACH ROW EXECUTE FUNCTION proteger_historial_trayecto();

CREATE FUNCTION copiar_trayecto_viaje() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE seleccionado trayecto%ROWTYPE;
BEGIN
    IF TG_OP = 'INSERT' OR NEW.id_trayecto IS DISTINCT FROM OLD.id_trayecto THEN
        SELECT * INTO seleccionado FROM trayecto WHERE id_trayecto=NEW.id_trayecto FOR SHARE;
        IF FOUND THEN
            IF NOT seleccionado.estado THEN
                RAISE EXCEPTION 'El trayecto está inactivo'
                    USING ERRCODE='23514', CONSTRAINT='trayecto_activo';
            END IF;
            NEW.kilometros := seleccionado.kilometros;
        END IF;
    ELSIF NEW.kilometros IS DISTINCT FROM OLD.kilometros THEN
        RAISE EXCEPTION 'Los kilómetros históricos no se modifican manualmente'
            USING ERRCODE='23514', CONSTRAINT='tramo_kilometros_historial';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER tramo_copiar_trayecto BEFORE INSERT OR UPDATE ON tramo_viaje
    FOR EACH ROW EXECUTE FUNCTION copiar_trayecto_viaje();

-- Candado transaccional común al registro/anulación de viajes y cambios de calendario.
-- El servicio lo obtiene antes de bloquear cualquier fila de viaje o chofer.
CREATE FUNCTION proteger_configuracion_remuneracion() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    IF EXISTS (SELECT 1 FROM remuneracion_chofer WHERE id_configuracion_remuneracion=OLD.id_configuracion_remuneracion
        AND (NEW.importe_diario<>OLD.importe_diario OR NEW.adicional_dia_especial<>OLD.adicional_dia_especial
            OR fecha<NEW.fecha_inicio OR fecha>NEW.fecha_fin)) THEN
        RAISE EXCEPTION 'La configuración ya se utilizó: cree una nueva vigencia para cambiar los importes'
            USING ERRCODE='23514', CONSTRAINT='remuneracion_historial';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER configuracion_remuneracion_historial BEFORE UPDATE OR DELETE ON configuracion_remuneracion
    FOR EACH ROW EXECUTE FUNCTION proteger_configuracion_remuneracion();

-- El mismo bloqueo que usa la API coordina horarios, configuraciones y costos.
CREATE FUNCTION validar_disponibilidad_vehiculo() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF NEW.estado='ANULADO' THEN RETURN NEW; END IF;
    IF TG_TABLE_NAME='viaje' THEN
        IF EXISTS (SELECT 1 FROM mantenimiento m WHERE m.id_vehiculo=NEW.id_vehiculo
            AND m.estado='REGISTRADO'
            AND tsrange(m.fecha_inicio,m.fecha_fin,'[)') && tsrange(NEW.fecha_inicio,NEW.fecha_fin,'[)')) THEN
            RAISE EXCEPTION 'El vehículo está en mantenimiento durante ese horario'
                USING ERRCODE='23514', CONSTRAINT='horario_cruce_mantenimiento';
        END IF;
    ELSE
        IF EXISTS (SELECT 1 FROM viaje v WHERE v.id_vehiculo=NEW.id_vehiculo AND v.estado='REGISTRADO'
            AND tsrange(v.fecha_inicio,v.fecha_fin,'[)') && tsrange(NEW.fecha_inicio,NEW.fecha_fin,'[)')) THEN
            RAISE EXCEPTION 'El mantenimiento coincide con un viaje del vehículo'
                USING ERRCODE='23514', CONSTRAINT='horario_cruce_viaje';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER viaje_disponibilidad BEFORE INSERT OR UPDATE ON viaje
    FOR EACH ROW EXECUTE FUNCTION validar_disponibilidad_vehiculo();
CREATE TRIGGER mantenimiento_disponibilidad BEFORE INSERT OR UPDATE ON mantenimiento
    FOR EACH ROW EXECUTE FUNCTION validar_disponibilidad_vehiculo();

CREATE FUNCTION proteger_configuracion_costos() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE usada BOOLEAN; fuera BOOLEAN; cambio BOOLEAN;
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF TG_OP='INSERT' THEN RETURN NEW; END IF;
    IF TG_TABLE_NAME='configuracion_combustible' THEN
        SELECT EXISTS(SELECT 1 FROM costo_viaje WHERE id_configuracion_combustible=OLD.id_configuracion_combustible) INTO usada;
        IF TG_OP='UPDATE' THEN
            cambio := NEW.consumo_galones_km<>OLD.consumo_galones_km OR NEW.precio_por_galon<>OLD.precio_por_galon;
            SELECT EXISTS(SELECT 1 FROM costo_viaje c JOIN viaje v USING(id_viaje)
                WHERE c.id_configuracion_combustible=OLD.id_configuracion_combustible
                AND (v.fecha_inicio::date<NEW.fecha_inicio OR v.fecha_inicio::date>NEW.fecha_fin)) INTO fuera;
        END IF;
    ELSIF TG_TABLE_NAME='configuracion_viatico' THEN
        SELECT EXISTS(SELECT 1 FROM viatico_chofer WHERE id_configuracion_viatico=OLD.id_configuracion_viatico) INTO usada;
        IF TG_OP='UPDATE' THEN
            cambio := NEW.importe_diario<>OLD.importe_diario;
            SELECT EXISTS(SELECT 1 FROM viatico_chofer WHERE id_configuracion_viatico=OLD.id_configuracion_viatico
                AND (fecha<NEW.fecha_inicio OR fecha>NEW.fecha_fin)) INTO fuera;
        END IF;
    ELSE
        SELECT EXISTS(SELECT 1 FROM tramo_viaje WHERE id_configuracion_peaje_trayecto=OLD.id_configuracion_peaje_trayecto) INTO usada;
        IF TG_OP='UPDATE' THEN
            cambio := NEW.importe<>OLD.importe OR NEW.id_trayecto<>OLD.id_trayecto;
            SELECT EXISTS(SELECT 1 FROM tramo_viaje t JOIN viaje v USING(id_viaje)
                WHERE t.id_configuracion_peaje_trayecto=OLD.id_configuracion_peaje_trayecto
                AND (v.fecha_inicio::date<NEW.fecha_inicio OR v.fecha_inicio::date>NEW.fecha_fin)) INTO fuera;
        END IF;
    END IF;
    IF usada AND (TG_OP='DELETE' OR cambio OR fuera) THEN
        RAISE EXCEPTION 'La configuración ya fue utilizada; conserve sus importes y las fechas históricas'
            USING ERRCODE='23514', CONSTRAINT='costos_configuracion_historial';
    END IF;
    IF TG_OP='DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER combustible_historial BEFORE INSERT OR UPDATE OR DELETE ON configuracion_combustible
    FOR EACH ROW EXECUTE FUNCTION proteger_configuracion_costos();
CREATE TRIGGER viatico_historial BEFORE INSERT OR UPDATE OR DELETE ON configuracion_viatico
    FOR EACH ROW EXECUTE FUNCTION proteger_configuracion_costos();
CREATE TRIGGER peaje_historial BEFORE INSERT OR UPDATE OR DELETE ON configuracion_peaje_trayecto
    FOR EACH ROW EXECUTE FUNCTION proteger_configuracion_costos();

-- Kilometraje derivado: no incluye viajes anulados, anteriores al control ni
-- viajes que todavía no hayan terminado a la fecha de corte.
CREATE FUNCTION kilometraje_vehiculo(p_vehiculo INTEGER, p_hasta TIMESTAMP)
RETURNS NUMERIC LANGUAGE sql STABLE AS $$
    SELECT CASE WHEN v.fecha_inicio_control_km IS NULL OR p_hasta<v.fecha_inicio_control_km THEN NULL
        ELSE v.kilometraje_base + COALESCE((SELECT SUM(t.kilometros)
            FROM viaje j JOIN tramo_viaje t USING(id_viaje)
            WHERE j.id_vehiculo=v.id_vehiculo AND j.estado='REGISTRADO'
                AND j.fecha_inicio>=v.fecha_inicio_control_km AND j.fecha_fin<=p_hasta),0) END
    FROM vehiculo v WHERE v.id_vehiculo=p_vehiculo;
$$;

CREATE FUNCTION validar_plan_mantenimiento() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE base NUMERIC;
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    SELECT kilometraje_base INTO base FROM vehiculo WHERE id_vehiculo=NEW.id_vehiculo FOR SHARE;
    IF base IS NOT NULL AND NEW.kilometraje_referencia_inicial>base THEN
        RAISE EXCEPTION 'La referencia del último servicio no puede superar el kilometraje base del vehículo'
            USING ERRCODE='23514', CONSTRAINT='seguimiento_referencia_inicial';
    END IF;
    IF TG_OP='UPDATE' AND (NEW.id_vehiculo<>OLD.id_vehiculo
        OR NEW.kilometraje_referencia_inicial<>OLD.kilometraje_referencia_inicial)
        AND EXISTS(SELECT 1 FROM cumplimiento_plan_mantenimiento
            WHERE id_plan_mantenimiento_vehiculo=OLD.id_plan_mantenimiento_vehiculo) THEN
        RAISE EXCEPTION 'El plan tiene cumplimientos: no se puede cambiar su vehículo ni su referencia inicial'
            USING ERRCODE='23514', CONSTRAINT='seguimiento_plan_historial';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER plan_mantenimiento_validar BEFORE INSERT OR UPDATE ON plan_mantenimiento_vehiculo
    FOR EACH ROW EXECUTE FUNCTION validar_plan_mantenimiento();

CREATE FUNCTION validar_referencia_kilometraje() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF TG_OP='UPDATE' AND (NEW.kilometraje_base IS DISTINCT FROM OLD.kilometraje_base
        OR NEW.fecha_inicio_control_km IS DISTINCT FROM OLD.fecha_inicio_control_km) THEN
        IF EXISTS(SELECT 1 FROM mantenimiento m JOIN cumplimiento_plan_mantenimiento c USING(id_mantenimiento)
            WHERE m.id_vehiculo=OLD.id_vehiculo) THEN
            RAISE EXCEPTION 'El vehículo tiene cumplimientos: no se puede cambiar el origen de su kilometraje'
                USING ERRCODE='23514', CONSTRAINT='seguimiento_base_historial';
        END IF;
        IF EXISTS(SELECT 1 FROM plan_mantenimiento_vehiculo WHERE id_vehiculo=OLD.id_vehiculo
            AND kilometraje_referencia_inicial>NEW.kilometraje_base) THEN
            RAISE EXCEPTION 'El kilometraje base dejaría referencias de planes fuera de su escala'
                USING ERRCODE='23514', CONSTRAINT='seguimiento_referencia_inicial';
        END IF;
    END IF;
    IF EXISTS(SELECT 1 FROM viaje WHERE id_vehiculo=NEW.id_vehiculo AND estado='REGISTRADO'
        AND fecha_inicio<NEW.fecha_inicio_control_km AND fecha_fin>NEW.fecha_inicio_control_km) THEN
        RAISE EXCEPTION 'El inicio del control de kilómetros no puede estar dentro de un viaje'
            USING ERRCODE='23514', CONSTRAINT='seguimiento_corte_viaje';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER vehiculo_referencia_km BEFORE INSERT OR UPDATE ON vehiculo
    FOR EACH ROW EXECUTE FUNCTION validar_referencia_kilometraje();

CREATE FUNCTION validar_cumplimiento_mantenimiento() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE m mantenimiento%ROWTYPE; p plan_mantenimiento_vehiculo%ROWTYPE; km NUMERIC;
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    SELECT * INTO m FROM mantenimiento WHERE id_mantenimiento=NEW.id_mantenimiento FOR SHARE;
    SELECT * INTO p FROM plan_mantenimiento_vehiculo
        WHERE id_plan_mantenimiento_vehiculo=NEW.id_plan_mantenimiento_vehiculo FOR SHARE;
    IF m.id_mantenimiento IS NULL OR p.id_plan_mantenimiento_vehiculo IS NULL THEN
        RAISE EXCEPTION 'Mantenimiento o plan inexistente'
            USING ERRCODE='23514', CONSTRAINT='seguimiento_referencia_invalida';
    END IF;
    IF TG_OP='INSERT' OR NEW.id_mantenimiento<>OLD.id_mantenimiento
        OR NEW.id_plan_mantenimiento_vehiculo<>OLD.id_plan_mantenimiento_vehiculo THEN
        IF m.estado<>'REGISTRADO' OR m.fecha_fin IS NULL OR NOT p.estado OR m.id_vehiculo<>p.id_vehiculo THEN
            RAISE EXCEPTION 'El cumplimiento requiere un mantenimiento finalizado y un plan activo del mismo vehículo'
                USING ERRCODE='23514', CONSTRAINT='seguimiento_cumplimiento_invalido';
        END IF;
    END IF;
    km := kilometraje_vehiculo(m.id_vehiculo,m.fecha_inicio);
    IF km IS NULL THEN
        RAISE EXCEPTION 'Configure el kilometraje base y un inicio de control anterior al mantenimiento'
            USING ERRCODE='23514', CONSTRAINT='seguimiento_sin_control';
    END IF;
    NEW.kilometraje_aplicado := km;
    RETURN NEW;
END;
$$;
CREATE TRIGGER cumplimiento_calcular BEFORE INSERT OR UPDATE ON cumplimiento_plan_mantenimiento
    FOR EACH ROW EXECUTE FUNCTION validar_cumplimiento_mantenimiento();

-- Se ejecuta al final de la transacción para ver todos los tramos del viaje.
CREATE FUNCTION reconciliar_cumplimientos_viaje() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE vehiculos INTEGER[]; control TIMESTAMP;
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF TG_TABLE_NAME='viaje' THEN
        IF TG_OP='DELETE' THEN vehiculos := ARRAY[OLD.id_vehiculo];
        ELSIF TG_OP='INSERT' THEN vehiculos := ARRAY[NEW.id_vehiculo];
        ELSE vehiculos := ARRAY[OLD.id_vehiculo,NEW.id_vehiculo]; END IF;
        IF TG_OP<>'DELETE' AND NEW.estado='REGISTRADO' THEN
            SELECT fecha_inicio_control_km INTO control FROM vehiculo WHERE id_vehiculo=NEW.id_vehiculo;
            IF NEW.fecha_inicio<control AND NEW.fecha_fin>control THEN
                RAISE EXCEPTION 'El viaje atraviesa el inicio del control de kilómetros'
                    USING ERRCODE='23514', CONSTRAINT='seguimiento_corte_viaje';
            END IF;
        END IF;
    ELSE
        IF TG_OP='INSERT' THEN
            SELECT ARRAY[id_vehiculo] INTO vehiculos FROM viaje WHERE id_viaje=NEW.id_viaje;
        ELSIF TG_OP='DELETE' THEN
            SELECT ARRAY[id_vehiculo] INTO vehiculos FROM viaje WHERE id_viaje=OLD.id_viaje;
        ELSE
            SELECT array_agg(DISTINCT id_vehiculo) INTO vehiculos FROM viaje WHERE id_viaje IN (OLD.id_viaje,NEW.id_viaje);
        END IF;
    END IF;
    UPDATE cumplimiento_plan_mantenimiento c SET kilometraje_aplicado=kilometraje_vehiculo(m.id_vehiculo,m.fecha_inicio)
    FROM mantenimiento m WHERE c.id_mantenimiento=m.id_mantenimiento AND m.id_vehiculo=ANY(vehiculos)
        AND m.estado='REGISTRADO' AND m.fecha_fin IS NOT NULL
        AND c.kilometraje_aplicado IS DISTINCT FROM kilometraje_vehiculo(m.id_vehiculo,m.fecha_inicio);
    RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER viaje_reconciliar_km AFTER INSERT OR UPDATE OR DELETE ON viaje
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION reconciliar_cumplimientos_viaje();
CREATE CONSTRAINT TRIGGER tramo_reconciliar_km AFTER INSERT OR UPDATE OR DELETE ON tramo_viaje
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION reconciliar_cumplimientos_viaje();

-- Protege las copias históricas y reserva cada entrega en una sola liquidación vigente.
CREATE FUNCTION validar_detalle_liquidacion() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE cab liquidacion%ROWTYPE; entrega RECORD;
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF TG_OP<>'INSERT' THEN
        SELECT * INTO cab FROM liquidacion WHERE id_liquidacion=OLD.id_liquidacion FOR UPDATE;
        IF cab.estado<>'BORRADOR' THEN
            RAISE EXCEPTION 'Los detalles de una liquidación enviada o anulada conservan su historial'
                USING ERRCODE='23514',CONSTRAINT='liquidacion_historial';
        END IF;
    END IF;
    IF TG_OP='DELETE' THEN RETURN OLD; END IF;
    SELECT * INTO cab FROM liquidacion WHERE id_liquidacion=NEW.id_liquidacion FOR UPDATE;
    IF NOT FOUND OR cab.estado<>'BORRADOR' THEN
        RAISE EXCEPTION 'Solo se agregan o modifican detalles de liquidaciones en borrador'
            USING ERRCODE='23514',CONSTRAINT='liquidacion_borrador';
    END IF;
    SELECT d.*,v.estado estado_viaje,v.fecha_inicio::date fecha,t.id_gasolinera
        INTO entrega FROM detalle_viaje d JOIN viaje v USING(id_viaje) JOIN tarifa t USING(id_tarifa)
        WHERE d.id_detalle_viaje=NEW.id_detalle_viaje FOR UPDATE OF d;
    IF NOT FOUND OR entrega.estado_viaje<>'REGISTRADO' OR entrega.id_gasolinera<>cab.id_gasolinera
        OR entrega.fecha NOT BETWEEN cab.periodo_inicio AND cab.periodo_fin THEN
        RAISE EXCEPTION 'La entrega debe pertenecer a un viaje válido, a la gasolinera y al período de la liquidación'
            USING ERRCODE='23514',CONSTRAINT='liquidacion_entrega';
    END IF;
    IF EXISTS (SELECT 1 FROM detalle_liquidacion d JOIN liquidacion l USING(id_liquidacion)
        WHERE d.id_detalle_viaje=NEW.id_detalle_viaje AND l.estado<>'ANULADA'
        AND d.id_detalle_liquidacion IS DISTINCT FROM NEW.id_detalle_liquidacion) THEN
        RAISE EXCEPTION 'La entrega ya pertenece a una liquidación no anulada'
            USING ERRCODE='23514',CONSTRAINT='liquidacion_entrega_ocupada';
    END IF;
    NEW.galones:=entrega.galones;
    NEW.tarifa_aplicada:=entrega.tarifa_aplicada;
    NEW.valor_transporte:=entrega.valor_transporte;
    RETURN NEW;
END;
$$;
CREATE TRIGGER detalle_liquidacion_validar BEFORE INSERT OR UPDATE OR DELETE ON detalle_liquidacion
    FOR EACH ROW EXECUTE FUNCTION validar_detalle_liquidacion();

CREATE FUNCTION proteger_liquidacion() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF TG_OP='INSERT' THEN
        IF NEW.estado<>'BORRADOR' THEN
            RAISE EXCEPTION 'Una liquidación debe crearse en borrador' USING ERRCODE='23514',CONSTRAINT='liquidacion_transicion';
        END IF;
        RETURN NEW;
    END IF;
    IF TG_OP='DELETE' THEN
        RAISE EXCEPTION 'Conserve la liquidación y use su anulación' USING ERRCODE='23514',CONSTRAINT='liquidacion_historial';
    END IF;
    IF OLD.estado='ANULADA' OR
        (NEW.estado<>OLD.estado AND NOT (
            (OLD.estado='BORRADOR' AND NEW.estado IN ('ENVIADA','ANULADA')) OR
            (OLD.estado='ENVIADA' AND NEW.estado IN ('CONFIRMADA','ANULADA')) OR
            (OLD.estado='CONFIRMADA' AND NEW.estado='ANULADA'))) THEN
        RAISE EXCEPTION 'Transición de liquidación no permitida' USING ERRCODE='23514',CONSTRAINT='liquidacion_transicion';
    END IF;
    IF OLD.estado<>'BORRADOR' AND
        ((to_jsonb(NEW)-ARRAY['estado','fecha_confirmacion','fecha_anulacion','motivo_anulacion'])
        IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['estado','fecha_confirmacion','fecha_anulacion','motivo_anulacion'])
        OR (OLD.fecha_confirmacion IS NOT NULL AND NEW.fecha_confirmacion IS DISTINCT FROM OLD.fecha_confirmacion)) THEN
        RAISE EXCEPTION 'Una liquidación enviada conserva sus datos e importes' USING ERRCODE='23514',CONSTRAINT='liquidacion_historial';
    END IF;
    IF NEW.estado='ANULADA' AND EXISTS(SELECT 1 FROM factura WHERE id_liquidacion=OLD.id_liquidacion) THEN
        RAISE EXCEPTION 'No se puede anular una liquidación con factura asociada' USING ERRCODE='23514',CONSTRAINT='liquidacion_facturada';
    END IF;
    IF NEW.estado<>'ANULADA' AND EXISTS (
        SELECT 1 FROM detalle_liquidacion dl JOIN detalle_viaje d USING(id_detalle_viaje)
        JOIN viaje v USING(id_viaje) JOIN tarifa t USING(id_tarifa)
        WHERE dl.id_liquidacion=NEW.id_liquidacion AND (v.estado<>'REGISTRADO'
            OR t.id_gasolinera<>NEW.id_gasolinera OR v.fecha_inicio::date NOT BETWEEN NEW.periodo_inicio AND NEW.periodo_fin)
    ) THEN
        RAISE EXCEPTION 'Las entregas no corresponden a la gasolinera o período de la liquidación'
            USING ERRCODE='23514',CONSTRAINT='liquidacion_entrega';
    END IF;
    IF NEW.estado='ENVIADA' AND OLD.estado='BORRADOR' THEN
        IF NOT EXISTS (SELECT 1 FROM detalle_liquidacion WHERE id_liquidacion=NEW.id_liquidacion)
            OR EXISTS (SELECT 1 FROM detalle_liquidacion dl JOIN detalle_viaje d USING(id_detalle_viaje)
                WHERE dl.id_liquidacion=NEW.id_liquidacion AND
                (dl.galones,dl.tarifa_aplicada,dl.valor_transporte) IS DISTINCT FROM (d.galones,d.tarifa_aplicada,d.valor_transporte))
            OR NEW.total_galones<>(SELECT sum(galones) FROM detalle_liquidacion WHERE id_liquidacion=NEW.id_liquidacion)
            OR NEW.valor_transporte<>(SELECT sum(valor_transporte) FROM detalle_liquidacion WHERE id_liquidacion=NEW.id_liquidacion)
            OR NEW.total_liquidacion<>NEW.valor_transporte-NEW.retencion+NEW.recargo THEN
            RAISE EXCEPTION 'Revise las entregas y los totales antes de enviar la liquidación'
                USING ERRCODE='23514',CONSTRAINT='liquidacion_totales';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER liquidacion_proteger BEFORE INSERT OR UPDATE OR DELETE ON liquidacion
    FOR EACH ROW EXECUTE FUNCTION proteger_liquidacion();

CREATE FUNCTION proteger_feriado() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF (TG_OP <> 'INSERT' AND EXISTS (SELECT 1 FROM remuneracion_chofer WHERE fecha=OLD.fecha))
        OR (TG_OP <> 'DELETE' AND EXISTS (SELECT 1 FROM remuneracion_chofer WHERE fecha=NEW.fecha)) THEN
        RAISE EXCEPTION 'No se puede cambiar un feriado después de generar remuneraciones para esa fecha'
            USING ERRCODE='23514', CONSTRAINT='remuneracion_historial';
    END IF;
    IF TG_OP='DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER feriado_historial BEFORE INSERT OR UPDATE OR DELETE ON feriado
    FOR EACH ROW EXECUTE FUNCTION proteger_feriado();

CREATE FUNCTION recalcular_remuneracion(p_chofer INTEGER, p_fecha DATE) RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE r remuneracion_chofer%ROWTYPE;
        c configuracion_remuneracion%ROWTYPE;
        modalidad TEXT;
        feriado_id INTEGER;
        trabajado BOOLEAN;
        domingo BOOLEAN;
        base NUMERIC(12,2);
        adicional NUMERIC(12,2);
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    SELECT tipo_remuneracion INTO modalidad FROM chofer WHERE id_chofer=p_chofer FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El chofer no existe' USING ERRCODE='23514', CONSTRAINT='remuneracion_chofer_invalido';
    END IF;
    SELECT * INTO r FROM remuneracion_chofer WHERE id_chofer=p_chofer AND fecha=p_fecha FOR UPDATE;
    IF FOUND THEN
        SELECT * INTO c FROM configuracion_remuneracion WHERE id_configuracion_remuneracion=r.id_configuracion_remuneracion FOR SHARE;
        modalidad := r.tipo_remuneracion_aplicado;
        feriado_id := r.id_feriado;
    ELSE
        SELECT * INTO c FROM configuracion_remuneracion
            WHERE fecha_inicio<=p_fecha AND (fecha_fin IS NULL OR fecha_fin>=p_fecha) FOR SHARE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'No existe configuración de remuneración vigente para %',p_fecha
                USING ERRCODE='23514', CONSTRAINT='remuneracion_sin_configuracion';
        END IF;
        SELECT id_feriado INTO feriado_id FROM feriado WHERE fecha=p_fecha;
    END IF;
    domingo := EXTRACT(DOW FROM p_fecha)=0;
    trabajado := EXISTS (SELECT 1 FROM viaje WHERE id_chofer=p_chofer AND fecha_inicio::date=p_fecha AND estado='REGISTRADO');
    base := CASE WHEN trabajado OR (modalidad='DIARIO_FIJO' AND NOT domingo) THEN c.importe_diario ELSE 0 END;
    adicional := CASE WHEN trabajado AND (domingo OR feriado_id IS NOT NULL) THEN c.adicional_dia_especial ELSE 0 END;
    IF r.id_remuneracion_chofer IS NULL THEN
        INSERT INTO remuneracion_chofer(id_chofer,id_configuracion_remuneracion,id_feriado,fecha,
            tipo_remuneracion_aplicado,trabajo_realizado,es_domingo,importe_base,importe_adicional,total)
        VALUES(p_chofer,c.id_configuracion_remuneracion,feriado_id,p_fecha,modalidad,trabajado,domingo,base,adicional,base+adicional)
        RETURNING * INTO r;
    ELSE
        UPDATE remuneracion_chofer SET trabajo_realizado=trabajado,importe_base=base,importe_adicional=adicional,total=base+adicional
            WHERE id_remuneracion_chofer=r.id_remuneracion_chofer RETURNING * INTO r;
    END IF;
    -- Los costos son asignaciones del total diario, no pagos adicionales.
    DELETE FROM costo_viaje cv USING viaje v WHERE cv.id_viaje=v.id_viaje
        AND cv.id_remuneracion_chofer=r.id_remuneracion_chofer AND v.estado='ANULADO';
    INSERT INTO costo_viaje(id_viaje,tipo_costo,valor,descripcion,id_remuneracion_chofer)
    SELECT id_viaje,'CHOFER',
        (div(r.total*100,n) + CASE WHEN posicion<=mod(r.total*100,n) THEN 1 ELSE 0 END)/100,
        'Asignación de la remuneración diaria',r.id_remuneracion_chofer
    FROM (SELECT id_viaje,COUNT(*) OVER () AS n,ROW_NUMBER() OVER (ORDER BY id_viaje) AS posicion
        FROM viaje WHERE id_chofer=p_chofer AND fecha_inicio::date=p_fecha AND estado='REGISTRADO') viajes
    ON CONFLICT (id_viaje,id_remuneracion_chofer) DO UPDATE SET valor=EXCLUDED.valor;
    RETURN r.id_remuneracion_chofer;
END;
$$;


-- Usuarios y permisos: estructura inicial. No crea cuentas ni sesiones.
CREATE TABLE rol (
    id_rol INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    CONSTRAINT rol_codigo CHECK (codigo IN ('JEFE', 'OPERADOR')),
    CONSTRAINT rol_nombre CHECK (btrim(nombre) <> '')
);

CREATE TABLE permiso (
    id_permiso INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(100) NOT NULL UNIQUE,
    modulo VARCHAR(50) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    exclusivo_jefe BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT permiso_codigo CHECK (codigo = modulo || '.' || accion),
    CONSTRAINT permiso_nombres CHECK (
        modulo ~ '^[a-z][a-z_]*$' AND accion ~ '^[a-z][a-z_]*$'
    )
);

CREATE TABLE rol_permiso (
    id_rol INTEGER NOT NULL REFERENCES rol(id_rol),
    id_permiso INTEGER NOT NULL REFERENCES permiso(id_permiso),
    PRIMARY KEY (id_rol, id_permiso)
);
CREATE INDEX idx_rol_permiso_permiso ON rol_permiso(id_permiso);

CREATE TABLE usuario (
    id_usuario INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    password_hash TEXT NOT NULL,
    id_rol INTEGER NOT NULL REFERENCES rol(id_rol),
    activo BOOLEAN NOT NULL DEFAULT true,
    requiere_cambio_password BOOLEAN NOT NULL DEFAULT true,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT usuario_nombre_usuario CHECK (nombre_usuario ~ '^[a-z0-9][a-z0-9._-]{2,49}$'),
    CONSTRAINT usuario_nombre CHECK (btrim(nombre) <> ''),
    CONSTRAINT usuario_password_hash CHECK (btrim(password_hash) <> ''),
    CONSTRAINT usuario_fechas CHECK (fecha_actualizacion >= fecha_creacion)
);
CREATE INDEX idx_usuario_rol ON usuario(id_rol);
COMMENT ON COLUMN usuario.password_hash IS 'Hash scrypt con parámetros y sal; nunca contraseña en texto plano.';

CREATE TABLE sesion (
    id_sesion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario),
    token_hash BYTEA NOT NULL UNIQUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMPTZ NOT NULL,
    fecha_revocacion TIMESTAMPTZ,
    CONSTRAINT sesion_token_hash CHECK (octet_length(token_hash) = 32),
    CONSTRAINT sesion_fechas CHECK (
        fecha_expiracion > fecha_creacion
        AND (fecha_revocacion IS NULL OR fecha_revocacion >= fecha_creacion)
    )
);
CREATE INDEX idx_sesion_usuario ON sesion(id_usuario);
CREATE INDEX idx_sesion_expiracion ON sesion(fecha_expiracion) WHERE fecha_revocacion IS NULL;
COMMENT ON COLUMN sesion.token_hash IS 'Resumen de 32 bytes del token; nunca el token de la cookie.';

INSERT INTO rol (codigo, nombre) VALUES ('JEFE', 'Jefe'), ('OPERADOR', 'Operador');
INSERT INTO permiso (codigo, modulo, accion, exclusivo_jefe) VALUES
    ('viajes.consultar', 'viajes', 'consultar', false),
    ('viajes.crear', 'viajes', 'crear', false),
    ('viajes.editar', 'viajes', 'editar', false),
    ('viajes.anular', 'viajes', 'anular', false),
    ('compras.consultar', 'compras', 'consultar', false),
    ('compras.crear', 'compras', 'crear', false),
    ('compras.anular', 'compras', 'anular', false),
    ('recepciones.consultar', 'recepciones', 'consultar', false),
    ('recepciones.crear', 'recepciones', 'crear', false),
    ('recepciones.anular', 'recepciones', 'anular', false),
    ('inventario.consultar', 'inventario', 'consultar', false),
    ('inventario.ajustar', 'inventario', 'ajustar', false),
    ('inventario.revertir', 'inventario', 'revertir', false),
    ('mantenimientos.consultar', 'mantenimientos', 'consultar', false),
    ('mantenimientos.crear', 'mantenimientos', 'crear', false),
    ('mantenimientos.finalizar', 'mantenimientos', 'finalizar', false),
    ('mantenimientos.anular', 'mantenimientos', 'anular', false),
    ('mantenimientos.registrar_cumplimientos', 'mantenimientos', 'registrar_cumplimientos', false),
    ('planes_mantenimiento.consultar', 'planes_mantenimiento', 'consultar', false),
    ('planes_mantenimiento.crear', 'planes_mantenimiento', 'crear', false),
    ('planes_mantenimiento.editar', 'planes_mantenimiento', 'editar', false),
    ('planes_mantenimiento.eliminar', 'planes_mantenimiento', 'eliminar', false),
    ('gastos.consultar', 'gastos', 'consultar', false),
    ('gastos.crear', 'gastos', 'crear', false),
    ('gastos.anular', 'gastos', 'anular', false),
    ('abastecimientos.consultar', 'abastecimientos', 'consultar', false),
    ('abastecimientos.crear', 'abastecimientos', 'crear', false),
    ('abastecimientos.anular', 'abastecimientos', 'anular', false),
    ('pagos_proveedor.consultar', 'pagos_proveedor', 'consultar', false),
    ('pagos_proveedor.crear', 'pagos_proveedor', 'crear', false),
    ('pagos_proveedor.anular', 'pagos_proveedor', 'anular', false),
    ('catalogos.consultar', 'catalogos', 'consultar', false),
    ('catalogos.crear', 'catalogos', 'crear', false),
    ('catalogos.editar', 'catalogos', 'editar', false),
    ('catalogos.eliminar', 'catalogos', 'eliminar', false),
    ('informes.consultar', 'informes', 'consultar', false),
    ('remuneraciones.consultar', 'remuneraciones', 'consultar', false),
    ('remuneraciones.generar', 'remuneraciones', 'generar', false),
    ('tarifas.consultar', 'tarifas', 'consultar', false),
    ('tarifas.crear', 'tarifas', 'crear', true),
    ('tarifas.editar', 'tarifas', 'editar', true),
    ('tarifas.eliminar', 'tarifas', 'eliminar', true),
    ('configuraciones.consultar', 'configuraciones', 'consultar', false),
    ('configuraciones.crear', 'configuraciones', 'crear', true),
    ('configuraciones.editar', 'configuraciones', 'editar', true),
    ('configuraciones.eliminar', 'configuraciones', 'eliminar', true),
    ('usuarios.consultar', 'usuarios', 'consultar', true),
    ('usuarios.crear', 'usuarios', 'crear', true),
    ('usuarios.editar', 'usuarios', 'editar', true),
    ('usuarios.desactivar', 'usuarios', 'desactivar', true),
    ('usuarios.restablecer_credenciales', 'usuarios', 'restablecer_credenciales', true),
    ('roles.consultar', 'roles', 'consultar', true),
    ('roles.asignar', 'roles', 'asignar', true),
    ('permisos.consultar', 'permisos', 'consultar', true),
    ('permisos.asignar', 'permisos', 'asignar', true),
    ('cierres.consultar', 'cierres', 'consultar', false),
    ('cierres.cerrar', 'cierres', 'cerrar', true),
    ('cierres.reabrir', 'cierres', 'reabrir', true),
    ('importaciones.consultar', 'importaciones', 'consultar', true),
    ('importaciones.ejecutar', 'importaciones', 'ejecutar', true);

INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM rol r CROSS JOIN permiso p
WHERE r.codigo = 'JEFE' OR NOT p.exclusivo_jefe;

-- Control persistente de intentos de autenticación.
CREATE TABLE autenticacion_intento (
    clave_hash BYTEA PRIMARY KEY CHECK (octet_length(clave_hash) = 32),
    intentos INTEGER NOT NULL CHECK (intentos > 0),
    fecha_limite TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_autenticacion_intento_limite ON autenticacion_intento(fecha_limite);

-- Revocación definitiva al desactivar un usuario o cambiar sus credenciales.
CREATE FUNCTION revocar_sesiones_usuario() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF (OLD.activo AND NOT NEW.activo) OR NEW.password_hash IS DISTINCT FROM OLD.password_hash THEN
        UPDATE sesion SET fecha_revocacion = clock_timestamp()
        WHERE id_usuario = NEW.id_usuario AND fecha_revocacion IS NULL;
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER usuario_revocar_sesiones AFTER UPDATE OF activo, password_hash ON usuario
    FOR EACH ROW EXECUTE FUNCTION revocar_sesiones_usuario();

-- Historial administrativo de usuarios, sin credenciales.
CREATE TABLE usuario_historial (
    id_historial BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario),
    id_actor INTEGER NOT NULL REFERENCES usuario(id_usuario),
    accion TEXT NOT NULL CHECK (accion IN ('CREAR', 'EDITAR', 'ESTADO', 'RESTABLECER_PASSWORD')),
    motivo VARCHAR(500),
    anterior JSONB,
    posterior JSONB NOT NULL,
    fecha TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX idx_usuario_historial_usuario ON usuario_historial(id_usuario, id_historial DESC);

-- Edición de viajes y auditoría (etapa 5).
ALTER TABLE viaje ADD COLUMN version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0);
CREATE TABLE viaje_historial (
    id_historial BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_viaje INTEGER NOT NULL REFERENCES viaje(id_viaje),
    id_actor INTEGER NOT NULL REFERENCES usuario(id_usuario),
    motivo VARCHAR(150) NOT NULL CHECK (btrim(motivo) <> ''),
    version_anterior INTEGER NOT NULL,
    version_nueva INTEGER NOT NULL CHECK (version_nueva = version_anterior + 1),
    anterior JSONB NOT NULL,
    posterior JSONB NOT NULL,
    fecha TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (id_viaje, version_nueva)
);

-- Normalmente inmediata; la edición difiere esta regla hasta actualizar fecha y tarifas.
CREATE FUNCTION validar_tarifas_viaje_final() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE viaje_id INTEGER; fecha_viaje DATE; vigente tarifa%ROWTYPE;
BEGIN
    viaje_id := NEW.id_viaje;
    SELECT fecha_inicio::date INTO fecha_viaje FROM viaje WHERE id_viaje=viaje_id FOR UPDATE;
    FOR vigente IN SELECT t.* FROM tarifa t WHERE t.id_tarifa IN
        (SELECT d.id_tarifa FROM detalle_viaje d WHERE d.id_viaje=viaje_id)
        ORDER BY t.id_tarifa FOR UPDATE
    LOOP
        IF fecha_viaje < vigente.fecha_inicio OR fecha_viaje > vigente.fecha_fin THEN
            RAISE EXCEPTION 'La tarifa no cubre la fecha del viaje'
                USING ERRCODE='23514', CONSTRAINT='viaje_tarifa_vigente';
        END IF;
    END LOOP;
    RETURN NULL;
END;
$$;
DROP TRIGGER viaje_validar_fecha ON viaje;
DROP TRIGGER detalle_viaje_validar_tarifa ON detalle_viaje;
CREATE CONSTRAINT TRIGGER viaje_validar_fecha AFTER UPDATE ON viaje
    DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION validar_tarifas_viaje_final();
CREATE CONSTRAINT TRIGGER detalle_viaje_validar_tarifa AFTER INSERT OR UPDATE ON detalle_viaje
    DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION validar_tarifas_viaje_final();
