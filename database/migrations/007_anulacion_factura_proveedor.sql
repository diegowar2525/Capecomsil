BEGIN;
ALTER TABLE factura_proveedor
    ADD COLUMN fecha_anulacion TIMESTAMP,
    ADD COLUMN motivo_anulacion VARCHAR(150);
COMMIT;
