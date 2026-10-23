BEGIN;
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(72631,1);

-- Los borradores se eliminan; solo se anulan liquidaciones enviadas o confirmadas.
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
COMMIT;
