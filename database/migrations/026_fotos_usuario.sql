BEGIN;
CREATE TABLE usuario_foto (
    id_usuario INTEGER PRIMARY KEY REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    clave TEXT NOT NULL UNIQUE,
    url TEXT NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT clock_timestamp()
);

-- Cola durable: reintenta borrar archivos antiguos y cargas que no llegaron a guardarse.
CREATE TABLE archivo_borrado_pendiente (
    clave TEXT PRIMARY KEY,
    disponible_desde TIMESTAMP NOT NULL DEFAULT clock_timestamp()
);

CREATE FUNCTION desvincular_foto_usuario() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'DELETE' OR NEW.imagen_url IS DISTINCT FROM OLD.imagen_url THEN
        INSERT INTO archivo_borrado_pendiente(clave)
        SELECT clave FROM usuario_foto WHERE id_usuario = OLD.id_usuario
        ON CONFLICT (clave) DO UPDATE SET disponible_desde = clock_timestamp();
        DELETE FROM usuario_foto WHERE id_usuario = OLD.id_usuario;
    END IF;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER usuario_foto_desvincular
BEFORE UPDATE OF imagen_url OR DELETE ON usuario
FOR EACH ROW EXECUTE FUNCTION desvincular_foto_usuario();
COMMIT;
