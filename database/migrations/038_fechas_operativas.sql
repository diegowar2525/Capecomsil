-- Fecha única para viajes y trabajos de mantenimiento.
BEGIN;
SELECT pg_advisory_xact_lock(72631,1);
DROP TRIGGER IF EXISTS viaje_disponibilidad ON viaje;
DROP TRIGGER IF EXISTS mantenimiento_disponibilidad ON mantenimiento;
DROP FUNCTION IF EXISTS validar_disponibilidad_vehiculo();
ALTER TABLE viaje DROP CONSTRAINT IF EXISTS viaje_horario,
    DROP CONSTRAINT IF EXISTS horario_viaje_vehiculo,
    DROP CONSTRAINT IF EXISTS horario_viaje_chofer;
ALTER TABLE mantenimiento DROP CONSTRAINT IF EXISTS horario_mantenimiento;
-- Al retirar fecha_fin también se elimina su CHECK de orden cronológico.
ALTER TABLE viaje DROP COLUMN fecha_fin;
ALTER TABLE mantenimiento DROP COLUMN fecha_fin;
ALTER TABLE viaje ALTER COLUMN fecha_inicio TYPE DATE USING fecha_inicio::date;
ALTER TABLE mantenimiento ALTER COLUMN fecha_inicio TYPE DATE USING fecha_inicio::date;

CREATE OR REPLACE FUNCTION kilometraje_vehiculo(p_vehiculo INTEGER, p_hasta TIMESTAMP)
RETURNS NUMERIC LANGUAGE sql STABLE AS $$
    SELECT CASE WHEN v.fecha_inicio_control_km IS NULL OR p_hasta::date<v.fecha_inicio_control_km::date THEN NULL
        ELSE v.kilometraje_base + COALESCE((SELECT SUM(t.kilometros)
            FROM viaje j JOIN tramo_viaje t USING(id_viaje)
            WHERE j.id_vehiculo=v.id_vehiculo AND j.estado='REGISTRADO'
                AND j.fecha_inicio>=v.fecha_inicio_control_km::date AND j.fecha_inicio<=p_hasta::date),0) END
    FROM vehiculo v WHERE v.id_vehiculo=p_vehiculo;
$$;

CREATE OR REPLACE FUNCTION validar_referencia_kilometraje() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF TG_OP='UPDATE' AND (NEW.kilometraje_base IS DISTINCT FROM OLD.kilometraje_base
        OR NEW.fecha_inicio_control_km IS DISTINCT FROM OLD.fecha_inicio_control_km) THEN
        IF EXISTS(SELECT 1 FROM mantenimiento m JOIN cumplimiento_plan_mantenimiento c USING(id_mantenimiento)
            WHERE m.id_vehiculo=OLD.id_vehiculo) THEN
            RAISE EXCEPTION 'El vehículo tiene cumplimientos: no se puede cambiar el origen de su kilometraje'
                USING ERRCODE='23514', CONSTRAINT='seguimiento_base_historial';
        END IF;
        IF EXISTS(SELECT 1 FROM plan_mantenimiento_vehiculo WHERE id_vehiculo=OLD.id_vehiculo
            AND kilometraje_referencia_inicial>NEW.kilometraje_base) THEN
            RAISE EXCEPTION 'El kilometraje base dejaría referencias de planes fuera de su escala'
                USING ERRCODE='23514', CONSTRAINT='seguimiento_referencia_inicial';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION validar_cumplimiento_mantenimiento() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE m mantenimiento%ROWTYPE; p plan_mantenimiento_vehiculo%ROWTYPE; km NUMERIC;
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    SELECT * INTO m FROM mantenimiento WHERE id_mantenimiento=NEW.id_mantenimiento FOR SHARE;
    SELECT * INTO p FROM plan_mantenimiento_vehiculo
        WHERE id_plan_mantenimiento_vehiculo=NEW.id_plan_mantenimiento_vehiculo FOR SHARE;
    IF m.id_mantenimiento IS NULL OR p.id_plan_mantenimiento_vehiculo IS NULL THEN
        RAISE EXCEPTION 'Mantenimiento o plan inexistente'
            USING ERRCODE='23514', CONSTRAINT='seguimiento_referencia_invalida';
    END IF;
    IF TG_OP='INSERT' OR NEW.id_mantenimiento<>OLD.id_mantenimiento
        OR NEW.id_plan_mantenimiento_vehiculo<>OLD.id_plan_mantenimiento_vehiculo THEN
        IF m.estado<>'REGISTRADO' OR m.clase<>'PREVENTIVO' OR NOT p.estado OR m.id_vehiculo<>p.id_vehiculo THEN
            RAISE EXCEPTION 'El cumplimiento requiere un mantenimiento preventivo registrado y un plan activo del mismo vehículo'
                USING ERRCODE='23514', CONSTRAINT='seguimiento_cumplimiento_invalido';
        END IF;
    END IF;
    km := kilometraje_vehiculo(m.id_vehiculo,m.fecha_inicio);
    IF km IS NULL THEN
        RAISE EXCEPTION 'Configure el kilometraje base y un inicio de control anterior al mantenimiento'
            USING ERRCODE='23514', CONSTRAINT='seguimiento_sin_control';
    END IF;
    NEW.kilometraje_aplicado := km;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION reconciliar_cumplimientos_viaje() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE vehiculos INTEGER[]; control TIMESTAMP;
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF TG_TABLE_NAME='viaje' THEN
        IF TG_OP='DELETE' THEN vehiculos := ARRAY[OLD.id_vehiculo];
        ELSIF TG_OP='INSERT' THEN vehiculos := ARRAY[NEW.id_vehiculo];
        ELSE vehiculos := ARRAY[OLD.id_vehiculo,NEW.id_vehiculo]; END IF;
    ELSE
        IF TG_OP='INSERT' THEN
            SELECT ARRAY[id_vehiculo] INTO vehiculos FROM viaje WHERE id_viaje=NEW.id_viaje;
        ELSIF TG_OP='DELETE' THEN
            SELECT ARRAY[id_vehiculo] INTO vehiculos FROM viaje WHERE id_viaje=OLD.id_viaje;
        ELSE
            SELECT array_agg(DISTINCT id_vehiculo) INTO vehiculos FROM viaje WHERE id_viaje IN (OLD.id_viaje,NEW.id_viaje);
        END IF;
    END IF;
    UPDATE cumplimiento_plan_mantenimiento c SET kilometraje_aplicado=kilometraje_vehiculo(m.id_vehiculo,m.fecha_inicio)
    FROM mantenimiento m WHERE c.id_mantenimiento=m.id_mantenimiento AND m.id_vehiculo=ANY(vehiculos)
        AND m.estado='REGISTRADO'
        AND c.kilometraje_aplicado IS DISTINCT FROM kilometraje_vehiculo(m.id_vehiculo,m.fecha_inicio);
    RETURN NULL;
END;
$$;
-- La referencia de los cumplimientos pasa a incluir todos los viajes del día.
UPDATE cumplimiento_plan_mantenimiento c
SET kilometraje_aplicado=kilometraje_vehiculo(m.id_vehiculo,m.fecha_inicio)
FROM mantenimiento m WHERE m.id_mantenimiento=c.id_mantenimiento AND m.estado='REGISTRADO'
AND kilometraje_vehiculo(m.id_vehiculo,m.fecha_inicio) IS NOT NULL;
COMMIT;
