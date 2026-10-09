BEGIN;
LOCK TABLE viaje, detalle_viaje, tarifa IN ACCESS EXCLUSIVE MODE;
-- No perder relaciones de cabeceras sin detalles ni interpretar estados desconocidos.
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM viaje v WHERE NOT EXISTS (SELECT 1 FROM detalle_viaje d WHERE d.id_viaje=v.id_viaje)) THEN
        RAISE EXCEPTION 'Hay viajes sin detalles: revisar sus entregas antes de migrar';
    END IF;
    IF EXISTS (SELECT 1 FROM viaje WHERE estado NOT IN ('PENDIENTE','REGISTRADO','ANULADO')) THEN
        RAISE EXCEPTION 'Hay estados de viaje desconocidos: revisar antes de migrar';
    END IF;
END $$;
DROP TRIGGER viaje_validar_tarifa ON viaje;
DROP TRIGGER tarifa_proteger_historial ON tarifa;
DROP FUNCTION validar_vigencia_tarifa_viaje();
DROP FUNCTION proteger_historial_tarifa();
ALTER TABLE detalle_viaje ADD COLUMN id_tarifa INTEGER, ADD COLUMN id_liquidacion INTEGER;
UPDATE detalle_viaje d SET id_tarifa=v.id_tarifa, id_liquidacion=v.id_liquidacion FROM viaje v WHERE v.id_viaje=d.id_viaje;
ALTER TABLE detalle_viaje
    ALTER COLUMN id_tarifa SET NOT NULL,
    ADD CONSTRAINT fk_detalle_viaje_tarifa FOREIGN KEY (id_tarifa) REFERENCES tarifa(id_tarifa),
    ADD CONSTRAINT fk_detalle_viaje_liquidacion FOREIGN KEY (id_liquidacion) REFERENCES liquidacion(id_liquidacion);
ALTER TABLE viaje DROP COLUMN id_tarifa, DROP COLUMN id_liquidacion,
    ADD COLUMN fecha_anulacion TIMESTAMP,
    ADD COLUMN motivo_anulacion VARCHAR(150),
    ALTER COLUMN estado SET DEFAULT 'REGISTRADO';
UPDATE viaje SET estado='REGISTRADO' WHERE estado='PENDIENTE';
ALTER TABLE viaje ADD CONSTRAINT chk_viaje_estado CHECK (estado IN ('REGISTRADO','ANULADO'));

CREATE FUNCTION proteger_historial_tarifa() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM detalle_viaje WHERE id_tarifa = OLD.id_tarifa) THEN
        IF NEW.id_gasolinera IS DISTINCT FROM OLD.id_gasolinera
            OR NEW.id_terminal IS DISTINCT FROM OLD.id_terminal
            OR NEW.valor_por_galon IS DISTINCT FROM OLD.valor_por_galon
            OR EXISTS (
                SELECT 1 FROM detalle_viaje d JOIN viaje v USING (id_viaje)
                WHERE d.id_tarifa = OLD.id_tarifa
                AND (v.fecha::date < NEW.fecha_inicio OR v.fecha::date > NEW.fecha_fin)
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
    SELECT fecha INTO fecha_viaje FROM viaje WHERE id_viaje=NEW.id_viaje FOR UPDATE;
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
        IF NEW.fecha::date < vigente.fecha_inicio OR NEW.fecha::date > vigente.fecha_fin THEN
            RAISE EXCEPTION 'La tarifa no cubre la fecha del viaje'
                USING ERRCODE = '23514', CONSTRAINT = 'viaje_tarifa_vigente';
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER viaje_validar_fecha BEFORE UPDATE OF fecha ON viaje
    FOR EACH ROW EXECUTE FUNCTION validar_fecha_viaje();

CREATE INDEX idx_detalle_viaje_tarifa ON detalle_viaje(id_tarifa);
CREATE INDEX idx_detalle_viaje_liquidacion ON detalle_viaje(id_liquidacion);
CREATE INDEX idx_detalle_viaje_viaje ON detalle_viaje(id_viaje);




COMMIT;
