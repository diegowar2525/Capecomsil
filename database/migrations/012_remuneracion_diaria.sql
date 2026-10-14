BEGIN;
LOCK TABLE viaje,chofer,costo_viaje IN ACCESS EXCLUSIVE MODE;
-- No descartar silenciosamente viajes antiguos de varios días.
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM viaje WHERE fecha_inicio::date <> fecha_fin::date) THEN
  RAISE EXCEPTION 'Existen viajes de varios días: revisar sus fechas antes de migrar';
 END IF;
 IF EXISTS (SELECT 1 FROM costo_viaje WHERE tipo_costo='CHOFER') THEN
  RAISE EXCEPTION 'Existen costos CHOFER manuales: conciliarlos antes de migrar';
 END IF;
END $$;
ALTER TABLE viaje DROP CONSTRAINT chk_viaje_fechas;
DROP TRIGGER viaje_validar_fecha ON viaje;
ALTER TABLE viaje RENAME COLUMN fecha_inicio TO fecha;
ALTER TABLE viaje ALTER COLUMN fecha TYPE DATE USING fecha::date;
ALTER TABLE viaje DROP COLUMN fecha_fin;
ALTER TABLE chofer DROP CONSTRAINT chk_chofer_tipo_remuneracion;
UPDATE chofer SET tipo_remuneracion=CASE tipo_remuneracion WHEN 'SUELDO' THEN 'DIARIO_FIJO' WHEN 'POR_VIAJE' THEN 'DIA_TRABAJADO' ELSE tipo_remuneracion END;
ALTER TABLE chofer ADD CONSTRAINT chk_chofer_tipo_remuneracion CHECK(tipo_remuneracion IN ('DIARIO_FIJO','DIA_TRABAJADO'));
-- Remuneración diaria y sus referencias históricas.
CREATE TABLE configuracion_remuneracion (
    id_configuracion_remuneracion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    importe_diario NUMERIC(12,2) NOT NULL CHECK (importe_diario > 0),
    adicional_dia_especial NUMERIC(12,2) NOT NULL CHECK (adicional_dia_especial >= 0),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    observacion TEXT,
    CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
    CONSTRAINT remuneracion_vigencias EXCLUDE USING gist (daterange(fecha_inicio,fecha_fin,'[]') WITH &&)
);

CREATE TABLE feriado (
    id_feriado INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha DATE NOT NULL UNIQUE,
    descripcion VARCHAR(150) NOT NULL CHECK (btrim(descripcion) <> ''),
    observacion TEXT
);

CREATE TABLE remuneracion_chofer (
    id_remuneracion_chofer INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_chofer INTEGER NOT NULL REFERENCES chofer(id_chofer),
    id_configuracion_remuneracion INTEGER NOT NULL REFERENCES configuracion_remuneracion(id_configuracion_remuneracion),
    id_feriado INTEGER REFERENCES feriado(id_feriado),
    fecha DATE NOT NULL,
    tipo_remuneracion_aplicado VARCHAR(20) NOT NULL CHECK (tipo_remuneracion_aplicado IN ('DIARIO_FIJO','DIA_TRABAJADO')),
    trabajo_realizado BOOLEAN NOT NULL,
    es_domingo BOOLEAN NOT NULL,
    importe_base NUMERIC(12,2) NOT NULL CHECK (importe_base >= 0),
    importe_adicional NUMERIC(12,2) NOT NULL CHECK (importe_adicional >= 0),
    total NUMERIC(12,2) NOT NULL CHECK (total = importe_base + importe_adicional),
    estado VARCHAR(10) NOT NULL DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO','CERRADO')),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP,
    observacion TEXT,
    UNIQUE (id_chofer,fecha),
    CHECK ((estado='ABIERTO' AND fecha_cierre IS NULL) OR (estado='CERRADO' AND fecha_cierre IS NOT NULL))
);

-- Reservado para la integración de usuarios. La API no escribe en este historial todavía.
CREATE TABLE historial_remuneracion_chofer (
    id_historial_remuneracion_chofer INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_remuneracion_chofer INTEGER NOT NULL REFERENCES remuneracion_chofer(id_remuneracion_chofer),
    accion VARCHAR(10) NOT NULL CHECK (accion IN ('CIERRE','REAPERTURA')),
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    motivo TEXT NOT NULL CHECK (btrim(motivo) <> ''),
    responsable TEXT NOT NULL CHECK (btrim(responsable) <> '')
);

ALTER TABLE costo_viaje ADD COLUMN id_remuneracion_chofer INTEGER REFERENCES remuneracion_chofer(id_remuneracion_chofer),
 ADD UNIQUE(id_viaje,id_remuneracion_chofer),
 ADD CONSTRAINT remuneracion_costo_origen CHECK ((tipo_costo='CHOFER') = (id_remuneracion_chofer IS NOT NULL));
CREATE OR REPLACE FUNCTION proteger_historial_tarifa() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM detalle_viaje WHERE id_tarifa = OLD.id_tarifa) THEN
        IF NEW.id_gasolinera IS DISTINCT FROM OLD.id_gasolinera
            OR NEW.id_terminal IS DISTINCT FROM OLD.id_terminal
            OR NEW.valor_por_galon IS DISTINCT FROM OLD.valor_por_galon
            OR EXISTS (
                SELECT 1 FROM detalle_viaje d JOIN viaje v USING (id_viaje)
                WHERE d.id_tarifa = OLD.id_tarifa
                AND (v.fecha < NEW.fecha_inicio OR v.fecha > NEW.fecha_fin)
            ) THEN
            RAISE EXCEPTION 'La modificación altera el historial de viajes'
                USING ERRCODE = '23514', CONSTRAINT = 'tarifa_historial';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION validar_vigencia_tarifa_viaje() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE vigente tarifa%ROWTYPE;
        fecha_viaje DATE;
BEGIN
    SELECT fecha INTO fecha_viaje FROM viaje WHERE id_viaje=NEW.id_viaje FOR UPDATE;
    SELECT * INTO vigente FROM tarifa WHERE id_tarifa = NEW.id_tarifa FOR UPDATE;
    IF FOUND AND (fecha_viaje::date < vigente.fecha_inicio OR fecha_viaje::date > vigente.fecha_fin) THEN
        RAISE EXCEPTION 'La tarifa no cubre la fecha del viaje'
            USING ERRCODE = '23514', CONSTRAINT = 'viaje_tarifa_vigente';
    END IF;
    RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION validar_fecha_viaje() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE vigente tarifa%ROWTYPE;
BEGIN
    FOR vigente IN SELECT t.* FROM tarifa t
        WHERE t.id_tarifa IN (SELECT d.id_tarifa FROM detalle_viaje d WHERE d.id_viaje=NEW.id_viaje)
        ORDER BY t.id_tarifa FOR UPDATE
    LOOP
        IF NEW.fecha < vigente.fecha_inicio OR NEW.fecha > vigente.fecha_fin THEN
            RAISE EXCEPTION 'La tarifa no cubre la fecha del viaje'
                USING ERRCODE = '23514', CONSTRAINT = 'viaje_tarifa_vigente';
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$;
-- Candado transaccional común al registro/anulación de viajes y cambios de calendario.
-- El servicio lo obtiene antes de bloquear cualquier fila de viaje o chofer.
CREATE TRIGGER viaje_validar_fecha BEFORE UPDATE OF fecha ON viaje
    FOR EACH ROW EXECUTE FUNCTION validar_fecha_viaje();

CREATE FUNCTION proteger_configuracion_remuneracion() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    IF EXISTS (SELECT 1 FROM remuneracion_chofer WHERE id_configuracion_remuneracion=OLD.id_configuracion_remuneracion
        AND (NEW.importe_diario<>OLD.importe_diario OR NEW.adicional_dia_especial<>OLD.adicional_dia_especial
            OR fecha<NEW.fecha_inicio OR fecha>NEW.fecha_fin)) THEN
        RAISE EXCEPTION 'La configuración ya se utilizó: cree una nueva vigencia para cambiar los importes'
            USING ERRCODE='23514', CONSTRAINT='remuneracion_historial';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER configuracion_remuneracion_historial BEFORE UPDATE OR DELETE ON configuracion_remuneracion
    FOR EACH ROW EXECUTE FUNCTION proteger_configuracion_remuneracion();

CREATE FUNCTION proteger_feriado() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF (TG_OP <> 'INSERT' AND EXISTS (SELECT 1 FROM remuneracion_chofer WHERE fecha=OLD.fecha))
        OR (TG_OP <> 'DELETE' AND EXISTS (SELECT 1 FROM remuneracion_chofer WHERE fecha=NEW.fecha)) THEN
        RAISE EXCEPTION 'No se puede cambiar un feriado después de generar remuneraciones para esa fecha'
            USING ERRCODE='23514', CONSTRAINT='remuneracion_historial';
    END IF;
    IF TG_OP='DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER feriado_historial BEFORE INSERT OR UPDATE OR DELETE ON feriado
    FOR EACH ROW EXECUTE FUNCTION proteger_feriado();

CREATE FUNCTION proteger_cierre_remuneracion() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.estado <> 'ABIERTO' OR (TG_OP='UPDATE' AND OLD.estado='CERRADO') THEN
        RAISE EXCEPTION 'El cierre y la reapertura están bloqueados hasta implementar usuarios y permisos'
            USING ERRCODE='23514', CONSTRAINT='remuneracion_cierre_bloqueado';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER remuneracion_cierre_bloqueado BEFORE INSERT OR UPDATE ON remuneracion_chofer
    FOR EACH ROW EXECUTE FUNCTION proteger_cierre_remuneracion();

CREATE FUNCTION recalcular_remuneracion(p_chofer INTEGER, p_fecha DATE) RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE r remuneracion_chofer%ROWTYPE;
        c configuracion_remuneracion%ROWTYPE;
        modalidad TEXT;
        feriado_id INTEGER;
        trabajado BOOLEAN;
        domingo BOOLEAN;
        base NUMERIC(12,2);
        adicional NUMERIC(12,2);
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    SELECT tipo_remuneracion INTO modalidad FROM chofer WHERE id_chofer=p_chofer FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El chofer no existe' USING ERRCODE='23514', CONSTRAINT='remuneracion_chofer_invalido';
    END IF;
    SELECT * INTO r FROM remuneracion_chofer WHERE id_chofer=p_chofer AND fecha=p_fecha FOR UPDATE;
    IF FOUND THEN
        IF r.estado='CERRADO' THEN
            RAISE EXCEPTION 'La remuneración del día está cerrada' USING ERRCODE='23514', CONSTRAINT='remuneracion_cerrada';
        END IF;
        SELECT * INTO c FROM configuracion_remuneracion WHERE id_configuracion_remuneracion=r.id_configuracion_remuneracion FOR SHARE;
        modalidad := r.tipo_remuneracion_aplicado;
        feriado_id := r.id_feriado;
    ELSE
        SELECT * INTO c FROM configuracion_remuneracion
            WHERE fecha_inicio<=p_fecha AND (fecha_fin IS NULL OR fecha_fin>=p_fecha) FOR SHARE;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'No existe configuración de remuneración vigente para %',p_fecha
                USING ERRCODE='23514', CONSTRAINT='remuneracion_sin_configuracion';
        END IF;
        SELECT id_feriado INTO feriado_id FROM feriado WHERE fecha=p_fecha;
    END IF;
    domingo := EXTRACT(DOW FROM p_fecha)=0;
    trabajado := EXISTS (SELECT 1 FROM viaje WHERE id_chofer=p_chofer AND fecha=p_fecha AND estado='REGISTRADO');
    base := CASE WHEN trabajado OR (modalidad='DIARIO_FIJO' AND NOT domingo) THEN c.importe_diario ELSE 0 END;
    adicional := CASE WHEN trabajado AND (domingo OR feriado_id IS NOT NULL) THEN c.adicional_dia_especial ELSE 0 END;
    IF r.id_remuneracion_chofer IS NULL THEN
        INSERT INTO remuneracion_chofer(id_chofer,id_configuracion_remuneracion,id_feriado,fecha,
            tipo_remuneracion_aplicado,trabajo_realizado,es_domingo,importe_base,importe_adicional,total)
        VALUES(p_chofer,c.id_configuracion_remuneracion,feriado_id,p_fecha,modalidad,trabajado,domingo,base,adicional,base+adicional)
        RETURNING * INTO r;
    ELSE
        UPDATE remuneracion_chofer SET trabajo_realizado=trabajado,importe_base=base,importe_adicional=adicional,total=base+adicional
            WHERE id_remuneracion_chofer=r.id_remuneracion_chofer RETURNING * INTO r;
    END IF;
    -- Los costos son asignaciones del total diario, no pagos adicionales.
    DELETE FROM costo_viaje cv USING viaje v WHERE cv.id_viaje=v.id_viaje
        AND cv.id_remuneracion_chofer=r.id_remuneracion_chofer AND v.estado='ANULADO';
    INSERT INTO costo_viaje(id_viaje,tipo_costo,valor,descripcion,id_remuneracion_chofer)
    SELECT id_viaje,'CHOFER',
        (div(r.total*100,n) + CASE WHEN posicion<=mod(r.total*100,n) THEN 1 ELSE 0 END)/100,
        'Asignación de la remuneración diaria',r.id_remuneracion_chofer
    FROM (SELECT id_viaje,COUNT(*) OVER () AS n,ROW_NUMBER() OVER (ORDER BY id_viaje) AS posicion
        FROM viaje WHERE id_chofer=p_chofer AND fecha=p_fecha AND estado='REGISTRADO') viajes
    ON CONFLICT (id_viaje,id_remuneracion_chofer) DO UPDATE SET valor=EXCLUDED.valor;
    RETURN r.id_remuneracion_chofer;
END;
$$;

-- Configuración inicial acordada. No genera días sin viajes de forma retroactiva.
INSERT INTO configuracion_remuneracion(importe_diario,adicional_dia_especial,fecha_inicio,observacion)
 VALUES (35,35,'2026-01-01','Configuración inicial; confirmar vigencias anteriores a 2026 antes de generar esos períodos');
SELECT recalcular_remuneracion(id_chofer,fecha) FROM (SELECT DISTINCT id_chofer,fecha FROM viaje WHERE estado='REGISTRADO') dias ORDER BY id_chofer,fecha;
COMMIT;
