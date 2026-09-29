-- Actualización para bases anteriores al modelo económico por detalle.
-- No inventa impuestos o descuentos de facturas históricas: si las hay, aborta.
BEGIN;
LOCK TABLE factura_proveedor, detalle_factura_proveedor IN ACCESS EXCLUSIVE MODE;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM factura_proveedor)
        OR EXISTS (SELECT 1 FROM detalle_factura_proveedor) THEN
        RAISE EXCEPTION 'Hay facturas históricas: requieren conciliación antes de esta migración';
    END IF;
END;
$$;

ALTER TABLE factura_proveedor
    RENAME COLUMN monto_total TO total;
ALTER TABLE factura_proveedor
    ADD COLUMN subtotal NUMERIC(14,2) NOT NULL,
    ADD COLUMN descuento_total NUMERIC(14,2) NOT NULL DEFAULT 0,
    ADD COLUMN impuestos NUMERIC(14,2) NOT NULL DEFAULT 0,
    DROP CONSTRAINT chk_factura_proveedor_monto,
    ADD CONSTRAINT chk_factura_proveedor_monto
        CHECK (subtotal >= 0 AND descuento_total >= 0 AND impuestos >= 0 AND total = subtotal + impuestos);

ALTER TABLE detalle_factura_proveedor
    ALTER COLUMN id_producto DROP NOT NULL,
    ADD COLUMN tipo_concepto VARCHAR(20) NOT NULL,
    ADD COLUMN descripcion TEXT NOT NULL,
    ADD COLUMN descuento NUMERIC(14,2) NOT NULL DEFAULT 0,
    ADD COLUMN porcentaje_impuesto NUMERIC(7,4) NOT NULL,
    ADD COLUMN impuesto NUMERIC(14,2) NOT NULL,
    ADD COLUMN total_linea NUMERIC(14,2) NOT NULL,
    ADD CONSTRAINT chk_detalle_factura_concepto
        CHECK ((tipo_concepto = 'PRODUCTO' AND id_producto IS NOT NULL)
            OR (tipo_concepto = 'SERVICIO' AND id_producto IS NULL)),
    ADD CONSTRAINT chk_detalle_factura_descripcion CHECK (btrim(descripcion) <> ''),
    DROP CONSTRAINT chk_detalle_factura_proveedor_valores,
    ADD CONSTRAINT chk_detalle_factura_proveedor_valores
        CHECK (cantidad > 0 AND precio_unitario >= 0
            AND descuento >= 0
            AND descuento <= round(cantidad * precio_unitario, 2)
            AND subtotal = round(cantidad * precio_unitario, 2) - descuento
            AND porcentaje_impuesto BETWEEN 0 AND 100
            AND impuesto = round(subtotal * porcentaje_impuesto / 100, 2)
            AND total_linea = subtotal + impuesto);
COMMIT;
