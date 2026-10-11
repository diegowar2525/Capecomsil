-- Ejecutar una sola vez sobre el esquema anterior. Todo se revierte si hay errores.
BEGIN;
LOCK TABLE viaje, detalle_viaje, producto, categoria_producto, detalle_mantenimiento IN ACCESS EXCLUSIVE MODE;
-- Sin distancias históricas no inventamos tramos. Solo se eliminan viajes sin vínculos económicos.
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM detalle_viaje WHERE id_liquidacion IS NOT NULL)
       OR EXISTS (SELECT 1 FROM costo_viaje) OR EXISTS (SELECT 1 FROM gasto WHERE id_viaje IS NOT NULL) THEN
        RAISE EXCEPTION 'Hay viajes con liquidaciones, costos o gastos: revisar antes de eliminar';
    END IF;
END $$;
DELETE FROM detalle_viaje;
DELETE FROM viaje;
ALTER TABLE viaje RENAME COLUMN fecha TO fecha_inicio;
ALTER TABLE viaje ALTER COLUMN fecha_inicio DROP DEFAULT;
ALTER TABLE viaje ADD COLUMN fecha_fin TIMESTAMP NOT NULL;
ALTER TABLE viaje ADD CONSTRAINT chk_viaje_fechas CHECK (fecha_fin >= fecha_inicio);
ALTER TABLE categoria_producto ADD COLUMN es_llanta BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE producto ADD COLUMN condicion_llanta VARCHAR(20);
ALTER TABLE producto ADD CONSTRAINT chk_producto_condicion_llanta CHECK (condicion_llanta IN ('NUEVA','REENCAUCHADA'));
-- Clasificación inicial revisada con el usuario; el funcionamiento posterior usa es_llanta.
UPDATE categoria_producto SET es_llanta = TRUE WHERE nombre = 'Llantas';
UPDATE producto SET condicion_llanta = 'NUEVA'
WHERE nombre = 'Llanta para tanquero' AND medida = '11R22.5'
AND id_categoria IN (SELECT id_categoria FROM categoria_producto WHERE es_llanta);
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM producto p JOIN categoria_producto c USING(id_categoria)
        WHERE c.es_llanta AND p.condicion_llanta IS NULL) THEN
        RAISE EXCEPTION 'Hay llantas sin condición confirmada';
    END IF;
END $$;
ALTER TABLE detalle_mantenimiento ALTER COLUMN id_producto DROP NOT NULL;
ALTER TABLE detalle_mantenimiento ADD COLUMN origen_producto VARCHAR(20) NOT NULL DEFAULT 'INVENTARIO';
ALTER TABLE detalle_mantenimiento ADD COLUMN descripcion_producto VARCHAR(200);
ALTER TABLE detalle_mantenimiento ADD CONSTRAINT chk_detalle_mantenimiento_origen CHECK (
    (origen_producto = 'INVENTARIO' AND id_producto IS NOT NULL)
    OR (origen_producto = 'EXTERNO' AND id_producto IS NULL AND descripcion_producto IS NOT NULL AND btrim(descripcion_producto) <> '')
);
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


CREATE OR REPLACE FUNCTION proteger_historial_tarifa() RETURNS trigger LANGUAGE plpgsql AS $$
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

CREATE OR REPLACE FUNCTION validar_vigencia_tarifa_viaje() RETURNS trigger LANGUAGE plpgsql AS $$
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

CREATE OR REPLACE FUNCTION validar_fecha_viaje() RETURNS trigger LANGUAGE plpgsql AS $$
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

COMMIT;
