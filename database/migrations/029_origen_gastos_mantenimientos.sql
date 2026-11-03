BEGIN;

ALTER TABLE gasto ADD COLUMN origen VARCHAR(20) NOT NULL DEFAULT 'OPERATIVO',
    ADD COLUMN id_tipo_gasto INTEGER REFERENCES tipo_gasto(id_tipo_gasto),
    ADD COLUMN id_mantenimiento INTEGER REFERENCES mantenimiento(id_mantenimiento),
    ADD COLUMN id_pago_proveedor INTEGER UNIQUE REFERENCES pago_proveedor(id_pago_proveedor);
UPDATE gasto g SET origen=CASE WHEN g.tipo_gasto IN ('VIATICO','COMBUSTIBLE') THEN g.tipo_gasto ELSE 'OPERATIVO' END,
    id_tipo_gasto=CASE WHEN g.tipo_gasto IN ('VIATICO','COMBUSTIBLE') THEN NULL ELSE t.id_tipo_gasto END
FROM tipo_gasto t WHERE t.codigo=g.tipo_gasto;
-- Conserva la comparación histórica de peajes sin depender del nombre editable.
ALTER TABLE tipo_gasto ADD COLUMN concepto_estimado VARCHAR(20) CHECK(concepto_estimado IN ('PEAJE'));
UPDATE tipo_gasto SET concepto_estimado='PEAJE' WHERE codigo='PEAJE';
ALTER TABLE gasto DROP COLUMN tipo_gasto;
DELETE FROM tipo_gasto WHERE codigo IN ('VIATICO','COMBUSTIBLE');
ALTER TABLE tipo_gasto DROP COLUMN codigo, DROP COLUMN reservado;
ALTER TABLE gasto ADD CONSTRAINT gasto_origen CHECK(origen IN ('OPERATIVO','VIATICO','COMBUSTIBLE','MANTENIMIENTO')),
    ADD CONSTRAINT gasto_tipo_operativo CHECK((origen='OPERATIVO')=(id_tipo_gasto IS NOT NULL)),
    ADD CONSTRAINT gasto_viatico_origen CHECK(id_viatico_chofer IS NULL OR (origen='VIATICO' AND id_viaje IS NULL)),
    ADD CONSTRAINT gasto_mantenimiento_origen CHECK((origen='MANTENIMIENTO')=(id_mantenimiento IS NOT NULL)),
    ADD CONSTRAINT gasto_pago_origen CHECK(id_pago_proveedor IS NULL OR origen='MANTENIMIENTO');
CREATE INDEX gasto_tipo_id ON gasto(id_tipo_gasto);
CREATE INDEX gasto_mantenimiento_id ON gasto(id_mantenimiento);

ALTER TABLE mantenimiento ADD COLUMN clase VARCHAR(20) CHECK(clase IN ('PREVENTIVO','CORRECTIVO')),
    ADD COLUMN id_factura_proveedor INTEGER UNIQUE REFERENCES factura_proveedor(id_factura_proveedor);
-- No se adivina la clasificación de trabajos históricos de texto libre.

CREATE VIEW gasto_clasificado AS SELECT g.*,
    CASE WHEN g.origen='OPERATIVO' THEN COALESCE(t.concepto_estimado,'OPERATIVO:'||t.id_tipo_gasto::text)
         ELSE g.origen END AS tipo_gasto,
    CASE WHEN g.origen='OPERATIVO' THEN t.nombre ELSE g.origen END AS nombre_tipo_gasto
FROM gasto g LEFT JOIN tipo_gasto t USING(id_tipo_gasto);

CREATE FUNCTION proteger_pago_mantenimiento() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE m mantenimiento%ROWTYPE; pagado NUMERIC;
BEGIN
    IF NEW.origen<>'MANTENIMIENTO' THEN RETURN NEW; END IF;
    PERFORM pg_advisory_xact_lock(72631,1);
    SELECT * INTO m FROM mantenimiento WHERE id_mantenimiento=NEW.id_mantenimiento FOR UPDATE;
    IF TG_OP='UPDATE' AND (to_jsonb(NEW)-ARRAY['estado','fecha_anulacion','motivo_anulacion']) IS DISTINCT FROM
                         (to_jsonb(OLD)-ARRAY['estado','fecha_anulacion','motivo_anulacion']) THEN
        RAISE EXCEPTION 'Un desembolso conserva su importe y referencias' USING ERRCODE='23514',CONSTRAINT='mantenimiento_pago_historial';
    END IF;
    IF NEW.estado='REGISTRADO' THEN
        IF m.estado<>'REGISTRADO' OR NEW.id_vehiculo IS DISTINCT FROM m.id_vehiculo OR NEW.id_proveedor IS DISTINCT FROM m.id_proveedor
            OR NEW.id_viaje IS NOT NULL OR NEW.fecha<m.fecha_inicio::date THEN
            RAISE EXCEPTION 'Datos del pago incompatibles con el mantenimiento' USING ERRCODE='23514',CONSTRAINT='mantenimiento_pago_datos';
        END IF;
        IF (m.id_factura_proveedor IS NULL) <> (NEW.id_pago_proveedor IS NULL) THEN
            RAISE EXCEPTION 'Use la vía de pago del mantenimiento' USING ERRCODE='23514',CONSTRAINT='mantenimiento_pago_via';
        END IF;
        IF NEW.id_pago_proveedor IS NOT NULL AND NOT EXISTS(SELECT 1 FROM pago_proveedor p WHERE p.id_pago_proveedor=NEW.id_pago_proveedor
            AND p.id_factura_proveedor=m.id_factura_proveedor AND p.estado='REGISTRADO' AND p.monto=NEW.monto AND p.fecha_pago=NEW.fecha) THEN
            RAISE EXCEPTION 'Pago de factura incompatible' USING ERRCODE='23514',CONSTRAINT='mantenimiento_pago_factura';
        END IF;
        SELECT COALESCE(sum(monto),0) INTO pagado FROM gasto WHERE id_mantenimiento=m.id_mantenimiento AND estado='REGISTRADO' AND id_gasto<>NEW.id_gasto;
        IF NEW.monto<=0 OR pagado+NEW.monto>m.monto THEN
            RAISE EXCEPTION 'El pago supera el saldo del mantenimiento' USING ERRCODE='23514',CONSTRAINT='mantenimiento_pago_saldo';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER gasto_mantenimiento_guard BEFORE INSERT OR UPDATE ON gasto FOR EACH ROW EXECUTE FUNCTION proteger_pago_mantenimiento();

CREATE FUNCTION reflejar_pago_mantenimiento() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE m mantenimiento%ROWTYPE;
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    SELECT * INTO m FROM mantenimiento WHERE id_factura_proveedor=NEW.id_factura_proveedor;
    IF NOT FOUND THEN RETURN NEW; END IF;
    IF TG_OP='INSERT' AND NEW.estado='REGISTRADO' THEN
        INSERT INTO gasto(origen,id_mantenimiento,id_pago_proveedor,id_vehiculo,id_proveedor,fecha,monto,numero_comprobante,descripcion)
        VALUES('MANTENIMIENTO',m.id_mantenimiento,NEW.id_pago_proveedor,m.id_vehiculo,m.id_proveedor,NEW.fecha_pago,NEW.monto,NEW.numero_comprobante,'Pago de factura de mantenimiento');
    ELSIF NEW.estado='ANULADO' THEN
        UPDATE gasto SET estado='ANULADO',fecha_anulacion=NEW.fecha_anulacion,motivo_anulacion=NEW.motivo_anulacion
        WHERE id_pago_proveedor=NEW.id_pago_proveedor AND estado='REGISTRADO';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER pago_mantenimiento_reflejo AFTER INSERT OR UPDATE ON pago_proveedor FOR EACH ROW EXECUTE FUNCTION reflejar_pago_mantenimiento();

CREATE FUNCTION proteger_factura_mantenimiento() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE f factura_proveedor%ROWTYPE;
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF TG_OP='UPDATE' AND NEW.id_factura_proveedor IS DISTINCT FROM OLD.id_factura_proveedor THEN
        RAISE EXCEPTION 'La vía de pago no se cambia después de registrar' USING ERRCODE='23514',CONSTRAINT='mantenimiento_pago_via';
    END IF;
    IF TG_OP='INSERT' AND NEW.id_factura_proveedor IS NOT NULL THEN
        SELECT * INTO f FROM factura_proveedor WHERE id_factura_proveedor=NEW.id_factura_proveedor FOR UPDATE;
        IF f.estado IS DISTINCT FROM 'REGISTRADA' OR f.id_proveedor IS DISTINCT FROM NEW.id_proveedor OR f.total<>NEW.monto THEN
            RAISE EXCEPTION 'La factura debe corresponder al proveedor y al importe completo del taller' USING ERRCODE='23514',CONSTRAINT='mantenimiento_factura_datos';
        END IF;
        IF EXISTS(SELECT 1 FROM pago_proveedor WHERE id_factura_proveedor=f.id_factura_proveedor AND estado='REGISTRADO' AND fecha_pago<NEW.fecha_inicio::date) THEN
            RAISE EXCEPTION 'La factura tiene pagos anteriores al trabajo' USING ERRCODE='23514',CONSTRAINT='mantenimiento_factura_datos';
        END IF;
    END IF;
    IF NEW.estado='ANULADO' AND (EXISTS(SELECT 1 FROM gasto WHERE id_mantenimiento=NEW.id_mantenimiento AND estado='REGISTRADO')
        OR EXISTS(SELECT 1 FROM factura_proveedor WHERE id_factura_proveedor=NEW.id_factura_proveedor AND estado<>'ANULADA')) THEN
        RAISE EXCEPTION 'Anule primero los pagos y la factura asociados' USING ERRCODE='23514',CONSTRAINT='mantenimiento_pagado';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER mantenimiento_factura_guard BEFORE INSERT OR UPDATE ON mantenimiento FOR EACH ROW EXECUTE FUNCTION proteger_factura_mantenimiento();

CREATE FUNCTION importar_pagos_mantenimiento() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO gasto(origen,id_mantenimiento,id_pago_proveedor,id_vehiculo,id_proveedor,fecha,monto,numero_comprobante,descripcion)
    SELECT 'MANTENIMIENTO',NEW.id_mantenimiento,p.id_pago_proveedor,NEW.id_vehiculo,NEW.id_proveedor,p.fecha_pago,p.monto,p.numero_comprobante,'Pago de factura de mantenimiento'
    FROM pago_proveedor p WHERE p.id_factura_proveedor=NEW.id_factura_proveedor AND p.estado='REGISTRADO';
    RETURN NEW;
END;
$$;
CREATE TRIGGER mantenimiento_pagos_iniciales AFTER INSERT ON mantenimiento FOR EACH ROW EXECUTE FUNCTION importar_pagos_mantenimiento();

INSERT INTO permiso(codigo,modulo,accion,exclusivo_jefe) VALUES ('mantenimientos.pagar','mantenimientos','pagar',false);
INSERT INTO rol_permiso(id_rol,id_permiso) SELECT r.id_rol,p.id_permiso FROM rol r CROSS JOIN permiso p
WHERE r.codigo IN ('JEFE','OPERADOR') AND p.codigo='mantenimientos.pagar';
COMMIT;
