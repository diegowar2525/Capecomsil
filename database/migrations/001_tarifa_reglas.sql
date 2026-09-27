-- Ejecutar una sola vez sobre una base existente, antes de usar /api/tarifas.
-- Si existen solapamientos, la transacción falla sin alterar los datos.
BEGIN;
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE tarifa ADD CONSTRAINT tarifa_sin_solapamientos
    EXCLUDE USING gist (
        id_gasolinera WITH =,
        id_terminal WITH =,
        daterange(fecha_inicio, fecha_fin, '[]') WITH &&
    );

CREATE FUNCTION proteger_historial_tarifa() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM viaje WHERE id_tarifa = OLD.id_tarifa) THEN
        IF NEW.id_gasolinera IS DISTINCT FROM OLD.id_gasolinera
            OR NEW.id_terminal IS DISTINCT FROM OLD.id_terminal
            OR NEW.valor_por_galon IS DISTINCT FROM OLD.valor_por_galon
            OR EXISTS (
                SELECT 1 FROM viaje WHERE id_tarifa = OLD.id_tarifa
                AND (fecha::date < NEW.fecha_inicio OR fecha::date > NEW.fecha_fin)
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

-- Serializa la asignación de viajes con cambios de tarifas.
-- La FK existente impide eliminar tarifas con viajes asociados.
CREATE FUNCTION validar_vigencia_tarifa_viaje() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE vigente tarifa%ROWTYPE;
BEGIN
    SELECT * INTO vigente FROM tarifa WHERE id_tarifa = NEW.id_tarifa FOR UPDATE;
    IF FOUND AND (NEW.fecha::date < vigente.fecha_inicio OR NEW.fecha::date > vigente.fecha_fin) THEN
        RAISE EXCEPTION 'La tarifa no cubre la fecha del viaje'
            USING ERRCODE = '23514', CONSTRAINT = 'viaje_tarifa_vigente';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER viaje_validar_tarifa BEFORE INSERT OR UPDATE OF id_tarifa, fecha ON viaje
    FOR EACH ROW EXECUTE FUNCTION validar_vigencia_tarifa_viaje();
COMMIT;
