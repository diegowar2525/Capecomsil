BEGIN;
CREATE TABLE empresa (
    id_empresa SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL CHECK (btrim(nombre) <> ''),
    ruc VARCHAR(20) UNIQUE,
    estado BOOLEAN NOT NULL DEFAULT TRUE
);
ALTER TABLE gasolinera ADD COLUMN id_empresa INTEGER REFERENCES empresa(id_empresa);
-- Agrupar exclusivamente por RUC conocido. El nombre inicial debe revisarse como razón social.
INSERT INTO empresa(nombre,ruc)
SELECT min(nombre), btrim(ruc) FROM gasolinera WHERE NULLIF(btrim(ruc),'') IS NOT NULL GROUP BY btrim(ruc);
UPDATE gasolinera g SET id_empresa=e.id_empresa FROM empresa e WHERE btrim(g.ruc)=e.ruc;
DO $$ DECLARE g record; empresa_id integer; BEGIN
    FOR g IN SELECT id_gasolinera,nombre FROM gasolinera WHERE id_empresa IS NULL LOOP
        INSERT INTO empresa(nombre) VALUES(g.nombre) RETURNING id_empresa INTO empresa_id;
        UPDATE gasolinera SET id_empresa=empresa_id WHERE id_gasolinera=g.id_gasolinera;
    END LOOP;
END $$;
CREATE INDEX gasolinera_empresa_idx ON gasolinera(id_empresa);

ALTER TABLE factura ADD COLUMN id_empresa INTEGER REFERENCES empresa(id_empresa);
-- Desactivar solo el guard durante la transformación estructural de documentos existentes.
ALTER TABLE factura DISABLE TRIGGER factura_cliente_guard;
UPDATE factura f SET id_empresa=g.id_empresa FROM liquidacion l JOIN gasolinera g USING(id_gasolinera)
WHERE l.id_liquidacion=f.id_liquidacion;
ALTER TABLE factura ALTER COLUMN id_empresa SET NOT NULL;
CREATE TABLE factura_liquidacion (
    id_factura INTEGER NOT NULL REFERENCES factura(id_factura),
    id_liquidacion INTEGER NOT NULL REFERENCES liquidacion(id_liquidacion),
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY(id_factura,id_liquidacion)
);
INSERT INTO factura_liquidacion SELECT id_factura,id_liquidacion,estado<>'ANULADA' FROM factura;
DROP INDEX factura_liquidacion_vigente;
ALTER TABLE factura DROP COLUMN id_liquidacion;
CREATE UNIQUE INDEX factura_liquidacion_vigente ON factura_liquidacion(id_liquidacion) WHERE vigente;
CREATE INDEX factura_empresa_idx ON factura(id_empresa);

CREATE OR REPLACE FUNCTION proteger_factura_cliente() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF TG_OP='DELETE' THEN
        RAISE EXCEPTION 'Las facturas se anulan, no se eliminan' USING ERRCODE='23514', CONSTRAINT='factura_cliente_historial';
    END IF;
    IF TG_OP='INSERT' THEN
        IF NEW.estado<>'REGISTRADA' OR NEW.fecha_anulacion IS NOT NULL OR NEW.motivo_anulacion IS NOT NULL
           OR NEW.id_usuario_anulacion IS NOT NULL OR NOT EXISTS(SELECT 1 FROM empresa WHERE id_empresa=NEW.id_empresa AND estado) THEN
            RAISE EXCEPTION 'Empresa o estado inválido' USING ERRCODE='23514',CONSTRAINT='factura_cliente_empresa';
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
ALTER TABLE factura ENABLE TRIGGER factura_cliente_guard;

CREATE FUNCTION proteger_factura_liquidacion() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE f factura%ROWTYPE; l liquidacion%ROWTYPE; empresa_id integer;
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF TG_OP='DELETE' THEN
        RAISE EXCEPTION 'Las asociaciones se conservan' USING ERRCODE='23514',CONSTRAINT='factura_cliente_historial';
    END IF;
    SELECT * INTO f FROM factura WHERE id_factura=NEW.id_factura FOR UPDATE;
    IF TG_OP='UPDATE' THEN
        IF OLD.id_factura<>NEW.id_factura OR OLD.id_liquidacion<>NEW.id_liquidacion OR NOT OLD.vigente
            OR NEW.vigente OR f.estado<>'ANULADA' THEN
            RAISE EXCEPTION 'Asociación inmutable' USING ERRCODE='23514',CONSTRAINT='factura_cliente_historial';
        END IF;
    ELSE
        SELECT * INTO l FROM liquidacion WHERE id_liquidacion=NEW.id_liquidacion FOR UPDATE;
        SELECT id_empresa INTO empresa_id FROM gasolinera WHERE id_gasolinera=l.id_gasolinera FOR SHARE;
        IF f.estado IS DISTINCT FROM 'REGISTRADA' OR l.estado IS DISTINCT FROM 'CONFIRMADA'
           OR empresa_id IS DISTINCT FROM f.id_empresa OR NOT NEW.vigente THEN
            RAISE EXCEPTION 'Las liquidaciones deben estar confirmadas y pertenecer a la empresa' USING ERRCODE='23514',CONSTRAINT='factura_cliente_liquidacion';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER factura_liquidacion_guard BEFORE INSERT OR UPDATE OR DELETE ON factura_liquidacion
FOR EACH ROW EXECUTE FUNCTION proteger_factura_liquidacion();

CREATE FUNCTION liberar_liquidaciones_factura() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    UPDATE factura_liquidacion SET vigente=false WHERE id_factura=NEW.id_factura AND vigente;
    RETURN NEW;
END;
$$;
CREATE TRIGGER factura_anulada_liquidaciones AFTER UPDATE OF estado ON factura
FOR EACH ROW WHEN (NEW.estado='ANULADA') EXECUTE FUNCTION liberar_liquidaciones_factura();

-- La cabecera y sus asociaciones se insertan en una sola transacción.
CREATE FUNCTION validar_totales_factura_empresa() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE f factura%ROWTYPE; t record;
BEGIN
    SELECT * INTO f FROM factura WHERE id_factura=NEW.id_factura;
    SELECT count(*) cantidad,sum(l.valor_transporte+l.recargo) subtotal,sum(l.retencion) retencion,sum(l.total_liquidacion) neto
    INTO t FROM factura_liquidacion fl JOIN liquidacion l USING(id_liquidacion) WHERE fl.id_factura=f.id_factura;
    IF t.cantidad=0 OR (f.subtotal,f.retencion,f.valor_neto) IS DISTINCT FROM (t.subtotal,t.retencion,t.neto) THEN
        RAISE EXCEPTION 'Importes inconsistentes con las liquidaciones' USING ERRCODE='23514',CONSTRAINT='factura_cliente_liquidacion';
    END IF;
    RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER factura_totales_empresa AFTER INSERT ON factura
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validar_totales_factura_empresa();
CREATE CONSTRAINT TRIGGER factura_liquidaciones_totales AFTER INSERT ON factura_liquidacion
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validar_totales_factura_empresa();

CREATE FUNCTION proteger_empresa_gasolinera() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF NEW.id_empresa IS DISTINCT FROM OLD.id_empresa AND EXISTS(
        SELECT 1 FROM liquidacion l JOIN factura_liquidacion fl USING(id_liquidacion) WHERE l.id_gasolinera=OLD.id_gasolinera
    ) THEN
        RAISE EXCEPTION 'No se puede cambiar la empresa de una gasolinera ya facturada' USING ERRCODE='23514',CONSTRAINT='gasolinera_empresa_facturada';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER gasolinera_empresa_guard BEFORE UPDATE OF id_empresa ON gasolinera
FOR EACH ROW EXECUTE FUNCTION proteger_empresa_gasolinera();
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
            (OLD.estado='BORRADOR' AND NEW.estado='PREPARADA') OR
            (OLD.estado='PREPARADA' AND NEW.estado IN ('BORRADOR','CONFIRMADA','ANULADA')) OR
            (OLD.estado='CONFIRMADA' AND NEW.estado='ANULADA'))) THEN
        RAISE EXCEPTION 'Transición de liquidación no permitida' USING ERRCODE='23514',CONSTRAINT='liquidacion_transicion';
    END IF;
    IF NEW.estado<>OLD.estado AND NEW.version<>OLD.version+1 THEN
        RAISE EXCEPTION 'La transición debe incrementar la versión' USING ERRCODE='23514',CONSTRAINT='liquidacion_version';
    END IF;
    IF OLD.estado<>'BORRADOR' AND NEW.estado=OLD.estado AND NEW.version<>OLD.version THEN
        RAISE EXCEPTION 'La versión solo cambia al transicionar' USING ERRCODE='23514',CONSTRAINT='liquidacion_version';
    END IF;
    IF OLD.estado='PREPARADA' AND NEW.estado='BORRADOR' THEN
        IF (to_jsonb(NEW)-ARRAY['estado','fecha_envio','version']) IS DISTINCT FROM
           (to_jsonb(OLD)-ARRAY['estado','fecha_envio','version']) THEN
            RAISE EXCEPTION 'La reapertura solo cambia el estado y la fecha de preparación' USING ERRCODE='23514',CONSTRAINT='liquidacion_historial';
        END IF;
    END IF;
    IF OLD.estado<>'BORRADOR' AND NEW.estado<>'BORRADOR' AND
        ((to_jsonb(NEW)-ARRAY['estado','fecha_confirmacion','fecha_anulacion','motivo_anulacion','version'])
        IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['estado','fecha_confirmacion','fecha_anulacion','motivo_anulacion','version'])
        OR (OLD.fecha_confirmacion IS NOT NULL AND NEW.fecha_confirmacion IS DISTINCT FROM OLD.fecha_confirmacion)) THEN
        RAISE EXCEPTION 'Una liquidación preparada conserva sus datos e importes' USING ERRCODE='23514',CONSTRAINT='liquidacion_historial';
    END IF;
    IF NEW.estado='ANULADA' AND EXISTS(SELECT 1 FROM factura_liquidacion WHERE id_liquidacion=OLD.id_liquidacion AND vigente) THEN
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
    IF NEW.estado='PREPARADA' AND OLD.estado='BORRADOR' THEN
        IF NOT EXISTS (SELECT 1 FROM detalle_liquidacion WHERE id_liquidacion=NEW.id_liquidacion)
            OR EXISTS (SELECT 1 FROM detalle_liquidacion dl JOIN detalle_viaje d USING(id_detalle_viaje)
                WHERE dl.id_liquidacion=NEW.id_liquidacion AND
                (dl.galones,dl.tarifa_aplicada,dl.valor_transporte) IS DISTINCT FROM (d.galones,d.tarifa_aplicada,d.valor_transporte))
            OR NEW.total_galones<>(SELECT sum(galones) FROM detalle_liquidacion WHERE id_liquidacion=NEW.id_liquidacion)
            OR NEW.valor_transporte<>(SELECT sum(valor_transporte) FROM detalle_liquidacion WHERE id_liquidacion=NEW.id_liquidacion)
            OR NEW.total_liquidacion<>NEW.valor_transporte-NEW.retencion+NEW.recargo THEN
            RAISE EXCEPTION 'Revise las entregas y los totales antes de preparar la liquidación'
                USING ERRCODE='23514',CONSTRAINT='liquidacion_totales';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
COMMIT;
