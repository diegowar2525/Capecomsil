-- Ejecutar en una transacción. El texto banco conserva el nombre histórico del cobro.
CREATE TABLE banco (
    id_banco integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre varchar(100) NOT NULL CHECK (btrim(nombre) <> ''),
    estado boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX uq_banco_nombre ON banco (lower(regexp_replace(btrim(nombre), '\s+', ' ', 'g')));
ALTER TABLE pago ADD COLUMN id_banco integer REFERENCES banco(id_banco);
INSERT INTO banco(nombre)
SELECT min(regexp_replace(btrim(banco), '\s+', ' ', 'g')) FROM pago
WHERE nullif(btrim(banco), '') IS NOT NULL
GROUP BY lower(regexp_replace(btrim(banco), '\s+', ' ', 'g'));
ALTER TABLE pago DISABLE TRIGGER cobro_cliente_guard;
UPDATE pago p SET id_banco = b.id_banco FROM banco b
WHERE lower(regexp_replace(btrim(p.banco), '\s+', ' ', 'g')) = lower(b.nombre);
ALTER TABLE pago ENABLE TRIGGER cobro_cliente_guard;

CREATE FUNCTION asignar_banco_cobro() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE entidad banco%ROWTYPE;
BEGIN
    -- Compatibilidad con importaciones históricas que proporcionan el nombre.
    IF NEW.id_banco IS NULL AND nullif(btrim(NEW.banco), '') IS NOT NULL THEN
        INSERT INTO banco(nombre) VALUES (regexp_replace(btrim(NEW.banco), '\s+', ' ', 'g'))
        ON CONFLICT DO NOTHING;
        SELECT * INTO entidad FROM banco
        WHERE lower(regexp_replace(btrim(nombre), '\s+', ' ', 'g')) = lower(regexp_replace(btrim(NEW.banco), '\s+', ' ', 'g')) FOR SHARE;
        NEW.id_banco := entidad.id_banco;
    ELSIF NEW.id_banco IS NOT NULL THEN
        SELECT * INTO entidad FROM banco WHERE id_banco=NEW.id_banco FOR SHARE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Banco inexistente' USING ERRCODE='23503', CONSTRAINT='pago_id_banco_fkey';
        END IF;
    ELSE
        NEW.banco := NULL;
        RETURN NEW;
    END IF;
    IF NOT entidad.estado THEN
        RAISE EXCEPTION 'Banco inactivo' USING ERRCODE='23514', CONSTRAINT='banco_activo';
    END IF;
    NEW.banco := entidad.nombre;
    RETURN NEW;
END $$;
CREATE TRIGGER banco_cobro_insert BEFORE INSERT ON pago
FOR EACH ROW EXECUTE FUNCTION asignar_banco_cobro();
