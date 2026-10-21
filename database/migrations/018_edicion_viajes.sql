BEGIN;
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(72631, 1);

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

COMMIT;
