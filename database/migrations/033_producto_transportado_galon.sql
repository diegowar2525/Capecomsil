BEGIN;
-- Normalizar nombres de la misma unidad; no convertir cantidades de otras unidades.
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM producto_transportado WHERE lower(translate(btrim(unidad_medida),'óÓ','oO')) NOT IN ('galon','galones')) THEN
  RAISE EXCEPTION 'Existen productos transportados con unidades distintas de galón; revisar antes de migrar';
 END IF;
END $$;
UPDATE producto_transportado SET unidad_medida='galón';
ALTER TABLE producto_transportado ALTER COLUMN unidad_medida SET DEFAULT 'galón';
ALTER TABLE producto_transportado ADD CONSTRAINT producto_transportado_unidad_galon CHECK (unidad_medida='galón');
COMMIT;
x