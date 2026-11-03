BEGIN;
SELECT pg_advisory_xact_lock(72631,1);
ALTER TABLE viaje_historial ALTER COLUMN motivo DROP NOT NULL;
ALTER TABLE mantenimiento ADD COLUMN version INTEGER NOT NULL DEFAULT 1 CHECK(version>0),
    ADD COLUMN pago_directo_automatico BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE detalle_mantenimiento ADD COLUMN vigente BOOLEAN NOT NULL DEFAULT true;
CREATE TABLE mantenimiento_historial (
    id_historial BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_mantenimiento INTEGER NOT NULL REFERENCES mantenimiento,
    id_actor INTEGER NOT NULL REFERENCES usuario,
    fecha TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    version_anterior INTEGER NOT NULL,
    version_nueva INTEGER NOT NULL,
    anterior JSONB NOT NULL,
    posterior JSONB NOT NULL,
    UNIQUE(id_mantenimiento,version_nueva)
);
CREATE FUNCTION versionar_mantenimiento() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.version := OLD.version+1;
    RETURN NEW;
END;
$$;
CREATE TRIGGER mantenimiento_version BEFORE UPDATE ON mantenimiento FOR EACH ROW EXECUTE FUNCTION versionar_mantenimiento();
INSERT INTO permiso(codigo,modulo,accion,exclusivo_jefe) VALUES
    ('mantenimientos.editar','mantenimientos','editar',false),
    ('mantenimientos.historial','mantenimientos','historial',false);
INSERT INTO rol_permiso(id_rol,id_permiso) SELECT r.id_rol,p.id_permiso FROM rol r CROSS JOIN permiso p
WHERE r.codigo IN ('JEFE','OPERADOR') AND p.codigo IN ('mantenimientos.editar','mantenimientos.historial');
COMMIT;
