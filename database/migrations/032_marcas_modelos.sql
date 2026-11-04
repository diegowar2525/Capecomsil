BEGIN;
CREATE TABLE marca (
 id_marca SERIAL PRIMARY KEY,
 ambito VARCHAR(10) NOT NULL CHECK (ambito IN ('VEHICULO','PRODUCTO')),
 nombre VARCHAR(100) NOT NULL CHECK (btrim(nombre) <> ''),
 estado BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE UNIQUE INDEX uq_marca_ambito_nombre ON marca(ambito, lower(regexp_replace(btrim(nombre), '\s+', ' ', 'g')));
CREATE TABLE modelo (
 id_modelo SERIAL PRIMARY KEY,
 id_marca INTEGER NOT NULL REFERENCES marca(id_marca) ON DELETE RESTRICT,
 nombre VARCHAR(100) NOT NULL CHECK (btrim(nombre) <> ''),
 estado BOOLEAN NOT NULL DEFAULT TRUE,
 UNIQUE(id_modelo,id_marca)
);
CREATE UNIQUE INDEX uq_modelo_marca_nombre ON modelo(id_marca, lower(regexp_replace(btrim(nombre), '\s+', ' ', 'g')));
ALTER TABLE vehiculo RENAME COLUMN marca TO marca_anterior;
ALTER TABLE vehiculo RENAME COLUMN modelo TO modelo_anterior;
ALTER TABLE vehiculo ADD COLUMN id_marca INTEGER REFERENCES marca(id_marca) ON DELETE RESTRICT;
ALTER TABLE vehiculo ADD COLUMN id_modelo INTEGER REFERENCES modelo(id_modelo) ON DELETE RESTRICT;
ALTER TABLE vehiculo ADD CONSTRAINT vehiculo_modelo_marca_fk FOREIGN KEY(id_modelo,id_marca) REFERENCES modelo(id_modelo,id_marca) ON DELETE RESTRICT;
ALTER TABLE vehiculo ADD CONSTRAINT vehiculo_modelo_requiere_marca CHECK(id_modelo IS NULL OR id_marca IS NOT NULL);
INSERT INTO marca(ambito,nombre)
 SELECT 'VEHICULO', min(regexp_replace(btrim(marca_anterior), '\s+', ' ', 'g')) FROM vehiculo
 WHERE nullif(btrim(marca_anterior),'') IS NOT NULL
 GROUP BY lower(regexp_replace(btrim(marca_anterior), '\s+', ' ', 'g'));
UPDATE vehiculo t SET id_marca=m.id_marca FROM marca m WHERE m.ambito='VEHICULO' AND lower(m.nombre)=lower(regexp_replace(btrim(t.marca_anterior), '\s+', ' ', 'g'));
INSERT INTO modelo(id_marca,nombre)
 SELECT id_marca,min(regexp_replace(btrim(modelo_anterior), '\s+', ' ', 'g')) FROM vehiculo
 WHERE id_marca IS NOT NULL AND nullif(btrim(modelo_anterior),'') IS NOT NULL
 GROUP BY id_marca,lower(regexp_replace(btrim(modelo_anterior), '\s+', ' ', 'g'));
UPDATE vehiculo t SET id_modelo=m.id_modelo FROM modelo m WHERE m.id_marca=t.id_marca AND lower(m.nombre)=lower(regexp_replace(btrim(t.modelo_anterior), '\s+', ' ', 'g'));
CREATE INDEX idx_vehiculo_marca ON vehiculo(id_marca);
CREATE INDEX idx_vehiculo_modelo ON vehiculo(id_modelo);
ALTER TABLE producto RENAME COLUMN marca TO marca_anterior;
ALTER TABLE producto RENAME COLUMN modelo TO modelo_anterior;
ALTER TABLE producto ADD COLUMN id_marca INTEGER REFERENCES marca(id_marca) ON DELETE RESTRICT;
ALTER TABLE producto ADD COLUMN id_modelo INTEGER REFERENCES modelo(id_modelo) ON DELETE RESTRICT;
ALTER TABLE producto ADD CONSTRAINT producto_modelo_marca_fk FOREIGN KEY(id_modelo,id_marca) REFERENCES modelo(id_modelo,id_marca) ON DELETE RESTRICT;
ALTER TABLE producto ADD CONSTRAINT producto_modelo_requiere_marca CHECK(id_modelo IS NULL OR id_marca IS NOT NULL);
INSERT INTO marca(ambito,nombre)
 SELECT 'PRODUCTO', min(regexp_replace(btrim(marca_anterior), '\s+', ' ', 'g')) FROM producto
 WHERE nullif(btrim(marca_anterior),'') IS NOT NULL
 GROUP BY lower(regexp_replace(btrim(marca_anterior), '\s+', ' ', 'g'));
UPDATE producto t SET id_marca=m.id_marca FROM marca m WHERE m.ambito='PRODUCTO' AND lower(m.nombre)=lower(regexp_replace(btrim(t.marca_anterior), '\s+', ' ', 'g'));
INSERT INTO modelo(id_marca,nombre)
 SELECT id_marca,min(regexp_replace(btrim(modelo_anterior), '\s+', ' ', 'g')) FROM producto
 WHERE id_marca IS NOT NULL AND nullif(btrim(modelo_anterior),'') IS NOT NULL
 GROUP BY id_marca,lower(regexp_replace(btrim(modelo_anterior), '\s+', ' ', 'g'));
UPDATE producto t SET id_modelo=m.id_modelo FROM modelo m WHERE m.id_marca=t.id_marca AND lower(m.nombre)=lower(regexp_replace(btrim(t.modelo_anterior), '\s+', ' ', 'g'));
CREATE INDEX idx_producto_marca ON producto(id_marca);
CREATE INDEX idx_producto_modelo ON producto(id_modelo);
CREATE FUNCTION validar_marca_modelo_referencia() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE ambito_esperado text; marca_actual marca%ROWTYPE; modelo_actual modelo%ROWTYPE; cambio boolean;
BEGIN
 ambito_esperado := CASE TG_TABLE_NAME WHEN 'vehiculo' THEN 'VEHICULO' ELSE 'PRODUCTO' END;
 cambio := TG_OP = 'INSERT';
 IF TG_OP = 'UPDATE' THEN cambio := NEW.id_marca IS DISTINCT FROM OLD.id_marca OR NEW.id_modelo IS DISTINCT FROM OLD.id_modelo; END IF;
 IF NEW.id_marca IS NOT NULL THEN
  SELECT * INTO marca_actual FROM marca WHERE id_marca=NEW.id_marca FOR SHARE;
  IF NOT FOUND OR marca_actual.ambito <> ambito_esperado THEN RAISE EXCEPTION 'La marca no corresponde al tipo de registro' USING ERRCODE='23514',CONSTRAINT='marca_modelo_referencia'; END IF;
  IF cambio AND NOT marca_actual.estado THEN RAISE EXCEPTION 'La marca seleccionada está inactiva' USING ERRCODE='23514',CONSTRAINT='marca_modelo_referencia'; END IF;
 END IF;
 IF NEW.id_modelo IS NOT NULL THEN
  SELECT * INTO modelo_actual FROM modelo WHERE id_modelo=NEW.id_modelo FOR SHARE;
  IF NOT FOUND OR modelo_actual.id_marca IS DISTINCT FROM NEW.id_marca THEN RAISE EXCEPTION 'El modelo no pertenece a la marca seleccionada' USING ERRCODE='23514',CONSTRAINT='marca_modelo_referencia'; END IF;
  IF cambio AND NOT modelo_actual.estado THEN RAISE EXCEPTION 'El modelo seleccionado está inactivo' USING ERRCODE='23514',CONSTRAINT='marca_modelo_referencia'; END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER vehiculo_marca_modelo BEFORE INSERT OR UPDATE ON vehiculo FOR EACH ROW EXECUTE FUNCTION validar_marca_modelo_referencia();
CREATE TRIGGER producto_marca_modelo BEFORE INSERT OR UPDATE ON producto FOR EACH ROW EXECUTE FUNCTION validar_marca_modelo_referencia();
COMMIT;
