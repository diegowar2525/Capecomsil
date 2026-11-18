-- Una misma empresa puede operar varias estaciones con el mismo RUC.
BEGIN;
ALTER TABLE gasolinera DROP CONSTRAINT IF EXISTS gasolinera_ruc_key;
COMMIT;
