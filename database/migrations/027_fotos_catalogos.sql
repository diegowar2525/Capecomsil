BEGIN;
CREATE TABLE catalogo_foto (
    id_foto SERIAL PRIMARY KEY,
    id_chofer INTEGER UNIQUE REFERENCES chofer(id_chofer) ON DELETE CASCADE,
    id_vehiculo INTEGER UNIQUE REFERENCES vehiculo(id_vehiculo) ON DELETE CASCADE,
    id_producto INTEGER UNIQUE REFERENCES producto(id_producto) ON DELETE CASCADE,
    clave TEXT NOT NULL UNIQUE,
    url TEXT NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT clock_timestamp(),
    CHECK (num_nonnulls(id_chofer, id_vehiculo, id_producto) = 1)
);

CREATE FUNCTION desvincular_foto_catalogo() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    columna TEXT;
    identificador INTEGER;
BEGIN
    CASE TG_TABLE_NAME
        WHEN 'chofer' THEN columna := 'id_chofer'; identificador := OLD.id_chofer;
        WHEN 'vehiculo' THEN columna := 'id_vehiculo'; identificador := OLD.id_vehiculo;
        WHEN 'producto' THEN columna := 'id_producto'; identificador := OLD.id_producto;
        ELSE RAISE EXCEPTION 'Catálogo de fotos no admitido';
    END CASE;
    IF TG_OP = 'DELETE' OR NEW.imagen_url IS DISTINCT FROM OLD.imagen_url THEN
        EXECUTE format(
            'INSERT INTO archivo_borrado_pendiente(clave)
             SELECT clave FROM catalogo_foto WHERE %I = $1
             ON CONFLICT (clave) DO UPDATE SET disponible_desde = clock_timestamp()', columna)
        USING identificador;
        EXECUTE format('DELETE FROM catalogo_foto WHERE %I = $1', columna) USING identificador;
    END IF;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER chofer_foto_desvincular BEFORE UPDATE OF imagen_url OR DELETE ON chofer
FOR EACH ROW EXECUTE FUNCTION desvincular_foto_catalogo();
CREATE TRIGGER vehiculo_foto_desvincular BEFORE UPDATE OF imagen_url OR DELETE ON vehiculo
FOR EACH ROW EXECUTE FUNCTION desvincular_foto_catalogo();
CREATE TRIGGER producto_foto_desvincular BEFORE UPDATE OF imagen_url OR DELETE ON producto
FOR EACH ROW EXECUTE FUNCTION desvincular_foto_catalogo();
COMMIT;
