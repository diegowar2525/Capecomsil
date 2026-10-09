BEGIN;
ALTER TABLE pago_proveedor
    ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'REGISTRADO',
    ADD COLUMN fecha_anulacion TIMESTAMP,
    ADD COLUMN motivo_anulacion VARCHAR(150),
    ADD CONSTRAINT chk_pago_proveedor_estado CHECK (estado IN ('REGISTRADO','ANULADO')),
    ADD CONSTRAINT chk_pago_proveedor_anulacion CHECK (
        (estado='REGISTRADO' AND fecha_anulacion IS NULL AND motivo_anulacion IS NULL)
        OR (estado='ANULADO' AND fecha_anulacion IS NOT NULL AND motivo_anulacion IS NOT NULL AND btrim(motivo_anulacion) <> '')
    );
-- El estado de pago se calcula de los pagos, no se deduce del estado antiguo.
ALTER TABLE factura_proveedor ALTER COLUMN estado SET DEFAULT 'REGISTRADA';
UPDATE factura_proveedor SET estado='REGISTRADA' WHERE estado IN ('PENDIENTE','PARCIAL','PAGADA','VENCIDA');
ALTER TABLE factura_proveedor ADD CONSTRAINT chk_factura_proveedor_estado CHECK (estado IN ('REGISTRADA','ANULADA'));
CREATE INDEX idx_pago_proveedor_factura ON pago_proveedor(id_factura_proveedor);
COMMIT;
