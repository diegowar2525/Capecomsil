BEGIN;
SET LOCAL lock_timeout='10s';
SELECT pg_advisory_xact_lock(72631,1);
LOCK TABLE liquidacion,detalle_viaje,factura IN ACCESS EXCLUSIVE MODE;
-- No inferir que una liquidación antigua fue enviada ni inventar su fecha de envío.
-- Esta migración admite el esquema previo vacío o liquidaciones BORRADOR sin confirmar.
DO $$ BEGIN
    IF EXISTS(SELECT 1 FROM liquidacion WHERE estado<>'BORRADOR' OR fecha_confirmacion IS NOT NULL) THEN
        RAISE EXCEPTION 'Revisar estados y fechas de liquidaciones existentes antes de migrar; no se inferirá su envío';
    END IF;
END $$;
ALTER TABLE liquidacion
    ADD COLUMN fecha_envio TIMESTAMP,
    ADD COLUMN fecha_anulacion TIMESTAMP,
    ADD COLUMN motivo_anulacion VARCHAR(150),
    ALTER COLUMN estado SET DEFAULT 'BORRADOR',
    ADD CONSTRAINT liquidacion_estado CHECK (estado IN ('BORRADOR','ENVIADA','CONFIRMADA','ANULADA')),
    ADD CONSTRAINT liquidacion_fechas CHECK (
        (estado='BORRADOR' AND fecha_envio IS NULL AND fecha_confirmacion IS NULL AND fecha_anulacion IS NULL AND motivo_anulacion IS NULL)
        OR (estado='ENVIADA' AND fecha_envio IS NOT NULL AND fecha_confirmacion IS NULL AND fecha_anulacion IS NULL AND motivo_anulacion IS NULL)
        OR (estado='CONFIRMADA' AND fecha_envio IS NOT NULL AND fecha_confirmacion IS NOT NULL AND fecha_anulacion IS NULL AND motivo_anulacion IS NULL)
        OR (estado='ANULADA' AND fecha_anulacion IS NOT NULL AND motivo_anulacion IS NOT NULL AND btrim(motivo_anulacion)<>'')
    ),
    ADD CONSTRAINT liquidacion_orden_fechas CHECK (
        (fecha_confirmacion IS NULL OR (fecha_envio IS NOT NULL AND fecha_confirmacion>=fecha_envio))
        AND (fecha_anulacion IS NULL OR fecha_anulacion>=COALESCE(fecha_confirmacion,fecha_envio,fecha_generacion))
    );
CREATE TABLE detalle_liquidacion (
    id_detalle_liquidacion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_liquidacion INTEGER NOT NULL REFERENCES liquidacion(id_liquidacion),
    id_detalle_viaje INTEGER NOT NULL REFERENCES detalle_viaje(id_detalle_viaje),
    galones NUMERIC(14,2) NOT NULL CHECK (galones>0),
    tarifa_aplicada NUMERIC(12,4) NOT NULL CHECK (tarifa_aplicada>=0),
    valor_transporte NUMERIC(14,2) NOT NULL CHECK (valor_transporte>=0),
    CONSTRAINT detalle_liquidacion_entrega_unica UNIQUE(id_liquidacion,id_detalle_viaje)
);
CREATE INDEX idx_detalle_liquidacion_entrega ON detalle_liquidacion(id_detalle_viaje);
INSERT INTO detalle_liquidacion(id_liquidacion,id_detalle_viaje,galones,tarifa_aplicada,valor_transporte)
SELECT id_liquidacion,id_detalle_viaje,galones,tarifa_aplicada,valor_transporte
FROM detalle_viaje WHERE id_liquidacion IS NOT NULL;
ALTER TABLE detalle_viaje DROP COLUMN id_liquidacion;

-- Protege las copias históricas y reserva cada entrega en una sola liquidación vigente.
CREATE FUNCTION validar_detalle_liquidacion() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE cab liquidacion%ROWTYPE; entrega RECORD;
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF TG_OP<>'INSERT' THEN
        SELECT * INTO cab FROM liquidacion WHERE id_liquidacion=OLD.id_liquidacion FOR UPDATE;
        IF cab.estado<>'BORRADOR' THEN
            RAISE EXCEPTION 'Los detalles de una liquidación enviada o anulada conservan su historial'
                USING ERRCODE='23514',CONSTRAINT='liquidacion_historial';
        END IF;
    END IF;
    IF TG_OP='DELETE' THEN RETURN OLD; END IF;
    SELECT * INTO cab FROM liquidacion WHERE id_liquidacion=NEW.id_liquidacion FOR UPDATE;
    IF NOT FOUND OR cab.estado<>'BORRADOR' THEN
        RAISE EXCEPTION 'Solo se agregan o modifican detalles de liquidaciones en borrador'
            USING ERRCODE='23514',CONSTRAINT='liquidacion_borrador';
    END IF;
    SELECT d.*,v.estado estado_viaje,v.fecha_inicio::date fecha,t.id_gasolinera
        INTO entrega FROM detalle_viaje d JOIN viaje v USING(id_viaje) JOIN tarifa t USING(id_tarifa)
        WHERE d.id_detalle_viaje=NEW.id_detalle_viaje FOR UPDATE OF d;
    IF NOT FOUND OR entrega.estado_viaje<>'REGISTRADO' OR entrega.id_gasolinera<>cab.id_gasolinera
        OR entrega.fecha NOT BETWEEN cab.periodo_inicio AND cab.periodo_fin THEN
        RAISE EXCEPTION 'La entrega debe pertenecer a un viaje válido, a la gasolinera y al período de la liquidación'
            USING ERRCODE='23514',CONSTRAINT='liquidacion_entrega';
    END IF;
    IF EXISTS (SELECT 1 FROM detalle_liquidacion d JOIN liquidacion l USING(id_liquidacion)
        WHERE d.id_detalle_viaje=NEW.id_detalle_viaje AND l.estado<>'ANULADA'
        AND d.id_detalle_liquidacion IS DISTINCT FROM NEW.id_detalle_liquidacion) THEN
        RAISE EXCEPTION 'La entrega ya pertenece a una liquidación no anulada'
            USING ERRCODE='23514',CONSTRAINT='liquidacion_entrega_ocupada';
    END IF;
    NEW.galones:=entrega.galones;
    NEW.tarifa_aplicada:=entrega.tarifa_aplicada;
    NEW.valor_transporte:=entrega.valor_transporte;
    RETURN NEW;
END;
$$;
CREATE TRIGGER detalle_liquidacion_validar BEFORE INSERT OR UPDATE OR DELETE ON detalle_liquidacion
    FOR EACH ROW EXECUTE FUNCTION validar_detalle_liquidacion();

CREATE FUNCTION proteger_liquidacion() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF TG_OP='INSERT' THEN
        IF NEW.estado<>'BORRADOR' THEN
            RAISE EXCEPTION 'Una liquidación debe crearse en borrador' USING ERRCODE='23514',CONSTRAINT='liquidacion_transicion';
        END IF;
        RETURN NEW;
    END IF;
    IF TG_OP='DELETE' THEN
        RAISE EXCEPTION 'Conserve la liquidación y use su anulación' USING ERRCODE='23514',CONSTRAINT='liquidacion_historial';
    END IF;
    IF OLD.estado='ANULADA' OR
        (NEW.estado<>OLD.estado AND NOT (
            (OLD.estado='BORRADOR' AND NEW.estado IN ('ENVIADA','ANULADA')) OR
            (OLD.estado='ENVIADA' AND NEW.estado IN ('CONFIRMADA','ANULADA')) OR
            (OLD.estado='CONFIRMADA' AND NEW.estado='ANULADA'))) THEN
        RAISE EXCEPTION 'Transición de liquidación no permitida' USING ERRCODE='23514',CONSTRAINT='liquidacion_transicion';
    END IF;
    IF OLD.estado<>'BORRADOR' AND
        ((to_jsonb(NEW)-ARRAY['estado','fecha_confirmacion','fecha_anulacion','motivo_anulacion'])
        IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['estado','fecha_confirmacion','fecha_anulacion','motivo_anulacion'])
        OR (OLD.fecha_confirmacion IS NOT NULL AND NEW.fecha_confirmacion IS DISTINCT FROM OLD.fecha_confirmacion)) THEN
        RAISE EXCEPTION 'Una liquidación enviada conserva sus datos e importes' USING ERRCODE='23514',CONSTRAINT='liquidacion_historial';
    END IF;
    IF NEW.estado='ANULADA' AND EXISTS(SELECT 1 FROM factura WHERE id_liquidacion=OLD.id_liquidacion) THEN
        RAISE EXCEPTION 'No se puede anular una liquidación con factura asociada' USING ERRCODE='23514',CONSTRAINT='liquidacion_facturada';
    END IF;
    IF NEW.estado<>'ANULADA' AND EXISTS (
        SELECT 1 FROM detalle_liquidacion dl JOIN detalle_viaje d USING(id_detalle_viaje)
        JOIN viaje v USING(id_viaje) JOIN tarifa t USING(id_tarifa)
        WHERE dl.id_liquidacion=NEW.id_liquidacion AND (v.estado<>'REGISTRADO'
            OR t.id_gasolinera<>NEW.id_gasolinera OR v.fecha_inicio::date NOT BETWEEN NEW.periodo_inicio AND NEW.periodo_fin)
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
CREATE TRIGGER liquidacion_proteger BEFORE INSERT OR UPDATE OR DELETE ON liquidacion
    FOR EACH ROW EXECUTE FUNCTION proteger_liquidacion();

COMMIT;
