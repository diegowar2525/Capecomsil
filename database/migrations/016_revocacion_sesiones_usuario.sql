BEGIN;
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(72631, 2);

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

COMMIT;
