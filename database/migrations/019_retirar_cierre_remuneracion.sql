BEGIN;
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(72631, 1);

-- Solo se retira el cierre de remuneraciones; se conservan importes y asignaciones.
DROP TRIGGER remuneracion_cierre_bloqueado ON remuneracion_chofer;
DROP FUNCTION proteger_cierre_remuneracion();
DROP TABLE historial_remuneracion_chofer;
ALTER TABLE remuneracion_chofer DROP COLUMN estado, DROP COLUMN fecha_cierre;

CREATE OR REPLACE FUNCTION recalcular_remuneracion(p_chofer INTEGER, p_fecha DATE) RETURNS INTEGER LANGUAGE plpgsql AS $$
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
    trabajado := EXISTS (SELECT 1 FROM viaje WHERE id_chofer=p_chofer AND fecha_inicio::date=p_fecha AND estado='REGISTRADO');
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
        FROM viaje WHERE id_chofer=p_chofer AND fecha_inicio::date=p_fecha AND estado='REGISTRADO') viajes
    ON CONFLICT (id_viaje,id_remuneracion_chofer) DO UPDATE SET valor=EXCLUDED.valor;
    RETURN r.id_remuneracion_chofer;
END;
$$;

COMMIT;
