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
        CHECK (tipo_remuneracion IN ('SUELDO', 'POR_VIAJE'))
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
-- VIAJE
-- =====================================================

CREATE TABLE viaje (
    id_viaje INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_vehiculo INTEGER NOT NULL,
    id_chofer INTEGER NOT NULL,

    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    CONSTRAINT chk_viaje_fechas CHECK (fecha_fin >= fecha_inicio),
    estado VARCHAR(30) NOT NULL DEFAULT 'REGISTRADO',
    fecha_anulacion TIMESTAMP,
    motivo_anulacion VARCHAR(150),
    CONSTRAINT chk_viaje_estado CHECK (estado IN ('REGISTRADO', 'ANULADO')),

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

CREATE TABLE tramo_viaje (
    id_tramo_viaje INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_viaje INTEGER NOT NULL REFERENCES viaje(id_viaje),
    orden INTEGER NOT NULL CHECK (orden > 0),
    id_terminal_origen INTEGER REFERENCES terminal(id_terminal),
    id_gasolinera_origen INTEGER REFERENCES gasolinera(id_gasolinera),
    id_terminal_destino INTEGER REFERENCES terminal(id_terminal),
    id_gasolinera_destino INTEGER REFERENCES gasolinera(id_gasolinera),
    kilometros NUMERIC(10,2) NOT NULL CHECK (kilometros > 0),
    observacion TEXT,
    CONSTRAINT uq_tramo_viaje_orden UNIQUE (id_viaje, orden) DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT chk_tramo_origen CHECK (num_nonnulls(id_terminal_origen, id_gasolinera_origen) = 1),
    CONSTRAINT chk_tramo_destino CHECK (num_nonnulls(id_terminal_destino, id_gasolinera_destino) = 1),
    CONSTRAINT chk_tramo_distinto CHECK (
        id_terminal_origen IS DISTINCT FROM id_terminal_destino
        OR id_gasolinera_origen IS DISTINCT FROM id_gasolinera_destino
    )
);

CREATE TABLE detalle_viaje (
    id_detalle_viaje INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_viaje INTEGER NOT NULL,
    id_tarifa INTEGER NOT NULL,
    id_liquidacion INTEGER,
    id_producto_transportado INTEGER NOT NULL,
    CONSTRAINT fk_detalle_viaje_tarifa FOREIGN KEY (id_tarifa) REFERENCES tarifa(id_tarifa),
    CONSTRAINT fk_detalle_viaje_liquidacion FOREIGN KEY (id_liquidacion) REFERENCES liquidacion(id_liquidacion),

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
        fecha_viaje TIMESTAMP;
BEGIN
    SELECT fecha_inicio INTO fecha_viaje FROM viaje WHERE id_viaje=NEW.id_viaje FOR UPDATE;
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
CREATE INDEX idx_detalle_viaje_liquidacion ON detalle_viaje(id_liquidacion);
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
        SELECT count(*), max(orden) INTO total, ultimo FROM tramo_viaje WHERE id_viaje = viaje_id;
        IF total = 0 OR total <> ultimo OR NOT EXISTS (
            SELECT 1 FROM tramo_viaje WHERE id_viaje = viaje_id AND orden = 1
                AND id_gasolinera_origen IS NOT NULL AND id_terminal_destino IS NOT NULL
        ) THEN
            RAISE EXCEPTION 'El recorrido debe comenzar en una gasolinera hacia un terminal y tener orden consecutivo'
                USING ERRCODE = '23514', CONSTRAINT = 'viaje_recorrido';
        END IF;
        IF EXISTS (
            SELECT 1 FROM tramo_viaje a JOIN tramo_viaje b
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
                SELECT 1 FROM tramo_viaje carga JOIN tramo_viaje entrega
                    ON entrega.id_viaje = carga.id_viaje AND entrega.orden > carga.orden
                WHERE carga.id_viaje = viaje_id AND carga.id_terminal_destino = t.id_terminal
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
