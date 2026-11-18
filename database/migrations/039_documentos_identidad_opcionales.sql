BEGIN;
ALTER TABLE chofer ALTER COLUMN cedula DROP NOT NULL;
ALTER TABLE proveedor ALTER COLUMN ruc DROP NOT NULL;
UPDATE chofer SET cedula = NULL WHERE btrim(cedula) = '';
UPDATE proveedor SET ruc = NULL WHERE btrim(ruc) = '';
COMMIT;
