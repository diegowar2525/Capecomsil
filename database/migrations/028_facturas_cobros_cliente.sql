BEGIN;

-- Registro de facturas externas. No emite documentos electrónicos.
ALTER TABLE factura DROP CONSTRAINT factura_id_liquidacion_key;
UPDATE factura SET estado='REGISTRADA' WHERE estado IN ('PENDIENTE','PAGADA','PARCIAL');
ALTER TABLE factura ALTER COLUMN estado SET DEFAULT 'REGISTRADA';
ALTER TABLE factura ADD COLUMN fecha_creacion TIMESTAMP NOT NULL DEFAULT clock_timestamp(),
    ADD COLUMN id_usuario_creacion INTEGER REFERENCES usuario(id_usuario),
    ADD COLUMN fecha_anulacion TIMESTAMP,
    ADD COLUMN motivo_anulacion VARCHAR(150),
    ADD COLUMN id_usuario_anulacion INTEGER REFERENCES usuario(id_usuario),
    ADD CONSTRAINT factura_estado_cliente CHECK(estado IN ('REGISTRADA','ANULADA')),
    ADD CONSTRAINT factura_vencimiento CHECK(fecha_vencimiento IS NULL OR fecha_vencimiento>=fecha_emision),
    ADD CONSTRAINT factura_neto CHECK(valor_neto=subtotal-retencion);
CREATE UNIQUE INDEX factura_liquidacion_vigente ON factura(id_liquidacion) WHERE estado<>'ANULADA';
ALTER TABLE pago ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'REGISTRADO',
    ADD COLUMN fecha_creacion TIMESTAMP NOT NULL DEFAULT clock_timestamp(),
    ADD COLUMN id_usuario_creacion INTEGER REFERENCES usuario(id_usuario),
    ADD COLUMN fecha_anulacion TIMESTAMP,
    ADD COLUMN motivo_anulacion VARCHAR(150),
    ADD COLUMN id_usuario_anulacion INTEGER REFERENCES usuario(id_usuario),
    ADD CONSTRAINT pago_estado_cliente CHECK(estado IN ('REGISTRADO','ANULADO'));
CREATE INDEX pago_factura_estado ON pago(id_factura,estado);

CREATE FUNCTION proteger_factura_cliente() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE l liquidacion%ROWTYPE;
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF TG_OP='DELETE' THEN
        RAISE EXCEPTION 'Las facturas se anulan, no se eliminan' USING ERRCODE='23514', CONSTRAINT='factura_cliente_historial';
    END IF;
    IF TG_OP='INSERT' THEN
        SELECT * INTO l FROM liquidacion WHERE id_liquidacion=NEW.id_liquidacion FOR UPDATE;
        IF l.estado IS DISTINCT FROM 'CONFIRMADA' OR NEW.estado<>'REGISTRADA'
            OR (NEW.subtotal,NEW.retencion,NEW.valor_neto) IS DISTINCT FROM (l.valor_transporte+l.recargo,l.retencion,l.total_liquidacion)
            OR NEW.fecha_anulacion IS NOT NULL OR NEW.motivo_anulacion IS NOT NULL OR NEW.id_usuario_anulacion IS NOT NULL THEN
            RAISE EXCEPTION 'La factura debe reflejar una liquidación confirmada' USING ERRCODE='23514', CONSTRAINT='factura_cliente_liquidacion';
        END IF;
    ELSE
        IF OLD.estado<>'REGISTRADA' OR NEW.estado<>'ANULADA' OR NEW.fecha_anulacion IS NULL OR NULLIF(btrim(NEW.motivo_anulacion),'') IS NULL
            OR (to_jsonb(NEW)-ARRAY['estado','fecha_anulacion','motivo_anulacion','id_usuario_anulacion']) IS DISTINCT FROM
               (to_jsonb(OLD)-ARRAY['estado','fecha_anulacion','motivo_anulacion','id_usuario_anulacion']) THEN
            RAISE EXCEPTION 'La factura solo admite anulación con motivo' USING ERRCODE='23514', CONSTRAINT='factura_cliente_historial';
        END IF;
        IF EXISTS(SELECT 1 FROM pago WHERE id_factura=OLD.id_factura AND estado='REGISTRADO') THEN
            RAISE EXCEPTION 'La factura tiene cobros vigentes' USING ERRCODE='23514', CONSTRAINT='factura_cliente_cobros';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER factura_cliente_guard BEFORE INSERT OR UPDATE OR DELETE ON factura FOR EACH ROW EXECUTE FUNCTION proteger_factura_cliente();

CREATE FUNCTION proteger_cobro_cliente() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE f factura%ROWTYPE; cobrado NUMERIC;
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF TG_OP='DELETE' THEN
        RAISE EXCEPTION 'Los cobros se anulan, no se eliminan' USING ERRCODE='23514', CONSTRAINT='cobro_cliente_historial';
    END IF;
    SELECT * INTO f FROM factura WHERE id_factura=NEW.id_factura FOR UPDATE;
    IF TG_OP='INSERT' THEN
        SELECT COALESCE(sum(monto),0) INTO cobrado FROM pago WHERE id_factura=NEW.id_factura AND estado='REGISTRADO';
        IF f.estado IS DISTINCT FROM 'REGISTRADA' OR NEW.estado<>'REGISTRADO' OR NEW.monto>f.valor_neto-cobrado OR NEW.fecha_pago<f.fecha_emision
            OR NEW.fecha_anulacion IS NOT NULL OR NEW.motivo_anulacion IS NOT NULL OR NEW.id_usuario_anulacion IS NOT NULL THEN
            RAISE EXCEPTION 'Revise el saldo, la fecha y el estado de la factura' USING ERRCODE='23514', CONSTRAINT='cobro_cliente_saldo';
        END IF;
    ELSIF OLD.estado<>'REGISTRADO' OR NEW.estado<>'ANULADO' OR NEW.fecha_anulacion IS NULL OR NULLIF(btrim(NEW.motivo_anulacion),'') IS NULL
        OR (to_jsonb(NEW)-ARRAY['estado','fecha_anulacion','motivo_anulacion','id_usuario_anulacion']) IS DISTINCT FROM
           (to_jsonb(OLD)-ARRAY['estado','fecha_anulacion','motivo_anulacion','id_usuario_anulacion']) THEN
        RAISE EXCEPTION 'El cobro solo admite anulación con motivo' USING ERRCODE='23514', CONSTRAINT='cobro_cliente_historial';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER cobro_cliente_guard BEFORE INSERT OR UPDATE OR DELETE ON pago FOR EACH ROW EXECUTE FUNCTION proteger_cobro_cliente();

UPDATE permiso SET exclusivo_jefe=false WHERE modulo='liquidaciones';
INSERT INTO permiso(codigo,modulo,accion,exclusivo_jefe) VALUES
    ('facturas_cliente.consultar','facturas_cliente','consultar',false),
    ('facturas_cliente.crear','facturas_cliente','crear',false),
    ('facturas_cliente.anular','facturas_cliente','anular',false),
    ('cobros_cliente.consultar','cobros_cliente','consultar',false),
    ('cobros_cliente.crear','cobros_cliente','crear',false),
    ('cobros_cliente.anular','cobros_cliente','anular',false);
INSERT INTO rol_permiso(id_rol,id_permiso)
SELECT r.id_rol,p.id_permiso FROM rol r CROSS JOIN permiso p
WHERE r.codigo IN ('JEFE','OPERADOR') AND p.modulo IN ('liquidaciones','facturas_cliente','cobros_cliente')
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION proteger_liquidacion() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF TG_OP='INSERT' THEN
        IF NEW.estado<>'BORRADOR' THEN
            RAISE EXCEPTION 'Una liquidación debe crearse en borrador' USING ERRCODE='23514',CONSTRAINT='liquidacion_transicion';
        END IF;
        RETURN NEW;
    END IF;
    IF TG_OP='DELETE' THEN
        IF OLD.estado<>'BORRADOR' THEN
            RAISE EXCEPTION 'Solo se eliminan borradores' USING ERRCODE='23514',CONSTRAINT='liquidacion_historial';
        END IF;
        RETURN OLD;
    END IF;
    IF OLD.estado='ANULADA' OR
        (NEW.estado<>OLD.estado AND NOT (
            (OLD.estado='BORRADOR' AND NEW.estado='ENVIADA') OR
            (OLD.estado='ENVIADA' AND NEW.estado IN ('CONFIRMADA','ANULADA')) OR
            (OLD.estado='CONFIRMADA' AND NEW.estado='ANULADA'))) THEN
        RAISE EXCEPTION 'Transición de liquidación no permitida' USING ERRCODE='23514',CONSTRAINT='liquidacion_transicion';
    END IF;
    IF NEW.estado<>OLD.estado AND NEW.version<>OLD.version+1 THEN
        RAISE EXCEPTION 'La transición debe incrementar la versión' USING ERRCODE='23514',CONSTRAINT='liquidacion_version';
    END IF;
    IF OLD.estado<>'BORRADOR' AND NEW.estado=OLD.estado AND NEW.version<>OLD.version THEN
        RAISE EXCEPTION 'La versión solo cambia al transicionar' USING ERRCODE='23514',CONSTRAINT='liquidacion_version';
    END IF;
    IF OLD.estado<>'BORRADOR' AND
        ((to_jsonb(NEW)-ARRAY['estado','fecha_confirmacion','fecha_anulacion','motivo_anulacion','version'])
        IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['estado','fecha_confirmacion','fecha_anulacion','motivo_anulacion','version'])
        OR (OLD.fecha_confirmacion IS NOT NULL AND NEW.fecha_confirmacion IS DISTINCT FROM OLD.fecha_confirmacion)) THEN
        RAISE EXCEPTION 'Una liquidación enviada conserva sus datos e importes' USING ERRCODE='23514',CONSTRAINT='liquidacion_historial';
    END IF;
    IF NEW.estado='ANULADA' AND EXISTS(SELECT 1 FROM factura WHERE id_liquidacion=OLD.id_liquidacion AND estado<>'ANULADA') THEN
        RAISE EXCEPTION 'No se puede anular una liquidación con factura asociada' USING ERRCODE='23514',CONSTRAINT='liquidacion_facturada';
    END IF;
    IF NEW.estado<>'ANULADA' AND EXISTS (
        SELECT 1 FROM detalle_liquidacion dl JOIN detalle_viaje d USING(id_detalle_viaje)
        JOIN viaje v USING(id_viaje)
        WHERE dl.id_liquidacion=NEW.id_liquidacion AND (v.estado<>'REGISTRADO'
            OR d.id_gasolinera<>NEW.id_gasolinera OR v.fecha_inicio::date NOT BETWEEN NEW.periodo_inicio AND NEW.periodo_fin)
    ) THEN
        RAISE EXCEPTION 'Las entregas no corresponden a la gasolinera o período de la liquidación'
            USING ERRCODE='23514',CONSTRAINT='liquidacion_entrega';
    END IF;
    IF NEW.estado='ENVIADA' AND OLD.estado='BORRADOR' THEN
        IF NOT EXISTS (SELECT 1 FROM detalle_liquidacion WHERE id_liquidacion=NEW.id_liquidacion)
            OR EXISTS (SELECT 1 FROM detalle_liquidacion dl JOIN detalle_viaje d USING(id_detalle_viaje)
                WHERE dl.id_liquidacion=NEW.id_liquidacion AND
                (dl.galones,dl.tarifa_aplicada,dl.valor_transporte) IS DISTINCT FROM (d.galones,d.tarifa_aplicada,d.valor_transporte))
            OR NEW.total_galones<>(SELECT sum(galones) FROM detalle_liquidacion WHERE id_liquidacion=NEW.id_liquidacion)
            OR NEW.valor_transporte<>(SELECT sum(valor_transporte) FROM detalle_liquidacion WHERE id_liquidacion=NEW.id_liquidacion)
            OR NEW.total_liquidacion<>NEW.valor_transporte-NEW.retencion+NEW.recargo THEN
            RAISE EXCEPTION 'Revise las entregas y los totales antes de enviar la liquidación'
                USING ERRCODE='23514',CONSTRAINT='liquidacion_totales';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

COMMIT;
