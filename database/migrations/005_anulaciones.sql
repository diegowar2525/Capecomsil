BEGIN;
ALTER TABLE mantenimiento
    ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'REGISTRADO' CHECK (estado IN ('REGISTRADO', 'ANULADO')),
    ADD COLUMN fecha_anulacion TIMESTAMP,
    ADD COLUMN motivo_anulacion VARCHAR(150);
ALTER TABLE recepcion_compra
    ADD COLUMN fecha_anulacion TIMESTAMP,
    ADD COLUMN motivo_anulacion VARCHAR(150);
COMMIT;
