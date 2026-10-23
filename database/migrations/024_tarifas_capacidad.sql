BEGIN;
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(72631,1);
LOCK TABLE gasolinera, tarifa, viaje, detalle_viaje IN SHARE ROW EXCLUSIVE MODE;

CREATE TABLE modalidad_tarifa_gasolinera (
    id_modalidad_tarifa INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_gasolinera INTEGER NOT NULL REFERENCES gasolinera(id_gasolinera) ON DELETE CASCADE,
    modalidad VARCHAR(20) NOT NULL CHECK (modalidad IN ('POR_TERMINAL','POR_CAPACIDAD')),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT modalidad_fechas CHECK (fecha_fin IS NULL OR fecha_fin>=fecha_inicio),
    CONSTRAINT modalidad_sin_solapamientos EXCLUDE USING gist
        (id_gasolinera WITH =, daterange(fecha_inicio,fecha_fin,'[]') WITH &&)
);
-- Conserva el comportamiento previo para todas las fechas de las gasolineras existentes.
INSERT INTO modalidad_tarifa_gasolinera(id_gasolinera,modalidad,fecha_inicio)
SELECT id_gasolinera,'POR_TERMINAL','0001-01-01' FROM gasolinera;
CREATE FUNCTION iniciar_modalidad_gasolinera() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO modalidad_tarifa_gasolinera(id_gasolinera,modalidad,fecha_inicio)
    VALUES (NEW.id_gasolinera,'POR_TERMINAL','0001-01-01');
    RETURN NEW;
END; $$;
CREATE TRIGGER gasolinera_modalidad_inicial AFTER INSERT ON gasolinera
FOR EACH ROW EXECUTE FUNCTION iniciar_modalidad_gasolinera();

CREATE TABLE tarifa_capacidad (
    id_tarifa_capacidad INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_gasolinera INTEGER NOT NULL REFERENCES gasolinera(id_gasolinera),
    capacidad_galones INTEGER NOT NULL CHECK (capacidad_galones IN (4000,6000,8000,10000)),
    valor_por_galon NUMERIC(12,4) NOT NULL CHECK (valor_por_galon>=0),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    estado BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT tarifa_capacidad_fechas CHECK (fecha_fin IS NULL OR fecha_fin>=fecha_inicio),
    CONSTRAINT tarifa_capacidad_sin_solapamientos EXCLUDE USING gist
        (id_gasolinera WITH =, capacidad_galones WITH =, daterange(fecha_inicio,fecha_fin,'[]') WITH &&)
        WHERE (estado)
);
ALTER TABLE detalle_viaje ALTER COLUMN id_tarifa DROP NOT NULL,
    ADD COLUMN id_tarifa_capacidad INTEGER REFERENCES tarifa_capacidad(id_tarifa_capacidad),
    ADD COLUMN id_modalidad_tarifa INTEGER REFERENCES modalidad_tarifa_gasolinera(id_modalidad_tarifa),
    ADD COLUMN id_gasolinera INTEGER REFERENCES gasolinera(id_gasolinera),
    ADD COLUMN id_terminal INTEGER REFERENCES terminal(id_terminal);
UPDATE detalle_viaje d SET id_gasolinera=t.id_gasolinera,id_terminal=t.id_terminal,
    id_modalidad_tarifa=m.id_modalidad_tarifa
FROM tarifa t JOIN modalidad_tarifa_gasolinera m USING(id_gasolinera) WHERE d.id_tarifa=t.id_tarifa;
SET CONSTRAINTS ALL IMMEDIATE;
ALTER TABLE detalle_viaje ALTER COLUMN id_modalidad_tarifa SET NOT NULL,
    ALTER COLUMN id_gasolinera SET NOT NULL, ALTER COLUMN id_terminal SET NOT NULL,
    ADD CONSTRAINT detalle_tarifa_exclusiva CHECK ((id_tarifa IS NULL) <> (id_tarifa_capacidad IS NULL));
CREATE INDEX idx_detalle_tarifa_capacidad ON detalle_viaje(id_tarifa_capacidad);
CREATE INDEX idx_detalle_modalidad ON detalle_viaje(id_modalidad_tarifa);
CREATE INDEX idx_detalle_gasolinera ON detalle_viaje(id_gasolinera);
SET CONSTRAINTS ALL DEFERRED;
SET CONSTRAINTS viaje_validar_fecha, detalle_viaje_validar_tarifa IMMEDIATE;

CREATE FUNCTION preparar_modalidad_entrega() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE fecha DATE;
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    SELECT fecha_inicio::date INTO fecha FROM viaje WHERE id_viaje=NEW.id_viaje FOR UPDATE;
    IF NEW.id_tarifa IS NOT NULL THEN
        SELECT id_gasolinera,id_terminal INTO NEW.id_gasolinera,NEW.id_terminal
        FROM tarifa WHERE id_tarifa=NEW.id_tarifa FOR UPDATE;
    ELSE
        SELECT id_gasolinera INTO NEW.id_gasolinera FROM tarifa_capacidad
        WHERE id_tarifa_capacidad=NEW.id_tarifa_capacidad FOR UPDATE;
    END IF;
    SELECT id_modalidad_tarifa INTO NEW.id_modalidad_tarifa FROM modalidad_tarifa_gasolinera
    WHERE id_gasolinera=NEW.id_gasolinera AND fecha_inicio<=fecha AND (fecha_fin IS NULL OR fecha_fin>=fecha) FOR SHARE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe modalidad vigente para la gasolinera y fecha'
        USING ERRCODE='23514',CONSTRAINT='modalidad_no_vigente';
    END IF;
    RETURN NEW;
END; $$;
CREATE TRIGGER entrega_preparar_modalidad BEFORE INSERT OR UPDATE ON detalle_viaje
FOR EACH ROW EXECUTE FUNCTION preparar_modalidad_entrega();

CREATE FUNCTION proteger_historial_modalidad() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF TG_OP='DELETE' THEN
        IF EXISTS(SELECT 1 FROM detalle_viaje WHERE id_modalidad_tarifa=OLD.id_modalidad_tarifa) THEN
            RAISE EXCEPTION 'La modalidad tiene viajes asociados' USING ERRCODE='23514',CONSTRAINT='modalidad_historial';
        END IF;
        RETURN OLD;
    END IF;
    IF EXISTS(SELECT 1 FROM detalle_viaje d JOIN viaje v USING(id_viaje)
        WHERE d.id_modalidad_tarifa=OLD.id_modalidad_tarifa AND
        (NEW.id_gasolinera<>OLD.id_gasolinera OR NEW.modalidad<>OLD.modalidad
        OR v.fecha_inicio::date<NEW.fecha_inicio OR v.fecha_inicio::date>NEW.fecha_fin)) THEN
        RAISE EXCEPTION 'El cambio de modalidad excluiría viajes ya registrados; elija otra fecha'
        USING ERRCODE='23514',CONSTRAINT='modalidad_historial';
    END IF;
    RETURN NEW;
END; $$;
CREATE TRIGGER modalidad_historial BEFORE UPDATE OR DELETE ON modalidad_tarifa_gasolinera
FOR EACH ROW EXECUTE FUNCTION proteger_historial_modalidad();

CREATE FUNCTION proteger_historial_tarifa_capacidad() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF EXISTS(SELECT 1 FROM detalle_viaje d JOIN viaje v USING(id_viaje)
        WHERE d.id_tarifa_capacidad=OLD.id_tarifa_capacidad AND
        (NEW.id_gasolinera<>OLD.id_gasolinera OR NEW.capacidad_galones<>OLD.capacidad_galones
        OR NEW.valor_por_galon<>OLD.valor_por_galon OR NEW.estado<>OLD.estado
        OR v.fecha_inicio::date<NEW.fecha_inicio OR v.fecha_inicio::date>NEW.fecha_fin)) THEN
        RAISE EXCEPTION 'La modificación altera el historial de viajes'
        USING ERRCODE='23514',CONSTRAINT='tarifa_capacidad_historial';
    END IF;
    RETURN NEW;
END; $$;
CREATE TRIGGER tarifa_capacidad_historial BEFORE UPDATE ON tarifa_capacidad
FOR EACH ROW EXECUTE FUNCTION proteger_historial_tarifa_capacidad();

CREATE OR REPLACE FUNCTION validar_tarifas_viaje_final() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE registro RECORD; fecha DATE; capacidad NUMERIC;
BEGIN
    SELECT v.fecha_inicio::date,veh.capacidad_galones INTO fecha,capacidad
    FROM viaje v JOIN vehiculo veh USING(id_vehiculo) WHERE v.id_viaje=NEW.id_viaje FOR UPDATE OF v;
    FOR registro IN SELECT d.*,m.modalidad,m.fecha_inicio mi,m.fecha_fin mf,
        COALESCE(t.fecha_inicio,c.fecha_inicio) ti,COALESCE(t.fecha_fin,c.fecha_fin) tf,
        c.capacidad_galones capacidad_tarifa,c.estado capacidad_activa
        FROM detalle_viaje d JOIN modalidad_tarifa_gasolinera m USING(id_modalidad_tarifa)
        LEFT JOIN tarifa t USING(id_tarifa) LEFT JOIN tarifa_capacidad c USING(id_tarifa_capacidad)
        WHERE d.id_viaje=NEW.id_viaje
    LOOP
        IF fecha<registro.mi OR fecha>registro.mf OR fecha<registro.ti OR fecha>registro.tf
            OR (registro.modalidad='POR_TERMINAL' AND registro.id_tarifa IS NULL)
            OR (registro.modalidad='POR_CAPACIDAD' AND (registro.id_tarifa_capacidad IS NULL
                OR registro.capacidad_tarifa<>capacidad OR NOT registro.capacidad_activa)) THEN
            RAISE EXCEPTION 'La modalidad o tarifa no corresponde a la fecha y capacidad del viaje'
            USING ERRCODE='23514',CONSTRAINT='viaje_modalidad_tarifa';
        END IF;
    END LOOP;
    RETURN NULL;
END; $$;

CREATE OR REPLACE FUNCTION validar_recorrido_viaje() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE ids INTEGER[]; viaje_id INTEGER; total INTEGER; ultimo INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN ids := ARRAY[NEW.id_viaje];
    ELSIF TG_OP = 'DELETE' THEN ids := ARRAY[OLD.id_viaje];
    ELSE ids := ARRAY[OLD.id_viaje, NEW.id_viaje]; END IF;
    FOREACH viaje_id IN ARRAY ids LOOP
        IF NOT EXISTS (SELECT 1 FROM viaje WHERE id_viaje = viaje_id) THEN CONTINUE; END IF;
        SELECT count(*), max(orden) INTO total, ultimo FROM (SELECT t.*, c.id_terminal_origen, c.id_gasolinera_origen, c.id_terminal_destino, c.id_gasolinera_destino FROM tramo_viaje t JOIN trayecto c USING (id_trayecto)) recorrido WHERE id_viaje = viaje_id;
        IF total = 0 OR total <> ultimo OR NOT EXISTS (
            SELECT 1 FROM (SELECT t.*, c.id_terminal_origen, c.id_gasolinera_origen, c.id_terminal_destino, c.id_gasolinera_destino FROM tramo_viaje t JOIN trayecto c USING (id_trayecto)) recorrido WHERE id_viaje = viaje_id AND orden = 1
        ) THEN
            RAISE EXCEPTION 'El recorrido debe contener tramos consecutivos desde 1'
                USING ERRCODE = '23514', CONSTRAINT = 'viaje_recorrido';
        END IF;
        IF EXISTS (
            SELECT 1 FROM (SELECT t.*, c.id_terminal_origen, c.id_gasolinera_origen, c.id_terminal_destino, c.id_gasolinera_destino FROM tramo_viaje t JOIN trayecto c USING (id_trayecto)) a JOIN (SELECT t.*, c.id_terminal_origen, c.id_gasolinera_origen, c.id_terminal_destino, c.id_gasolinera_destino FROM tramo_viaje t JOIN trayecto c USING (id_trayecto)) b
                ON b.id_viaje = a.id_viaje AND b.orden = a.orden + 1
            WHERE a.id_viaje = viaje_id AND (
                a.id_terminal_destino IS DISTINCT FROM b.id_terminal_origen
                OR a.id_gasolinera_destino IS DISTINCT FROM b.id_gasolinera_origen)
        ) THEN
            RAISE EXCEPTION 'Los tramos del viaje no son continuos'
                USING ERRCODE = '23514', CONSTRAINT = 'viaje_recorrido';
        END IF;
        IF EXISTS (
            SELECT 1 FROM detalle_viaje d
            WHERE d.id_viaje = viaje_id AND NOT EXISTS (
                SELECT 1 FROM (SELECT t.*, c.id_terminal_origen, c.id_gasolinera_origen, c.id_terminal_destino, c.id_gasolinera_destino FROM tramo_viaje t JOIN trayecto c USING (id_trayecto)) carga JOIN (SELECT t.*, c.id_terminal_origen, c.id_gasolinera_origen, c.id_terminal_destino, c.id_gasolinera_destino FROM tramo_viaje t JOIN trayecto c USING (id_trayecto)) entrega
                    ON entrega.id_viaje = carga.id_viaje
                WHERE carga.id_viaje = viaje_id AND (
                    (carga.id_terminal_origen = d.id_terminal AND carga.orden <= entrega.orden)
                    OR (carga.id_terminal_destino = d.id_terminal AND carga.orden < entrega.orden))
                    AND entrega.id_gasolinera_destino = d.id_gasolinera
            )
        ) THEN
            RAISE EXCEPTION 'El recorrido debe visitar el terminal antes de la gasolinera de cada entrega'
                USING ERRCODE = '23514', CONSTRAINT = 'viaje_recorrido_entregas';
        END IF;
    END LOOP;
    RETURN NULL;
END;
$$;
CREATE OR REPLACE FUNCTION validar_detalle_liquidacion() RETURNS trigger LANGUAGE plpgsql AS $$
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
    SELECT d.*,v.estado estado_viaje,v.fecha_inicio::date fecha
        INTO entrega FROM detalle_viaje d JOIN viaje v USING(id_viaje)
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
