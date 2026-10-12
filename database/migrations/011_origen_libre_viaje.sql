-- Requiere el esquema con catálogo TRAYECTO. Conserva todos los registros.
BEGIN;
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
            SELECT 1 FROM detalle_viaje d JOIN tarifa t USING(id_tarifa)
            WHERE d.id_viaje = viaje_id AND NOT EXISTS (
                SELECT 1 FROM (SELECT t.*, c.id_terminal_origen, c.id_gasolinera_origen, c.id_terminal_destino, c.id_gasolinera_destino FROM tramo_viaje t JOIN trayecto c USING (id_trayecto)) carga JOIN (SELECT t.*, c.id_terminal_origen, c.id_gasolinera_origen, c.id_terminal_destino, c.id_gasolinera_destino FROM tramo_viaje t JOIN trayecto c USING (id_trayecto)) entrega
                    ON entrega.id_viaje = carga.id_viaje
                WHERE carga.id_viaje = viaje_id AND (
                    (carga.id_terminal_origen = t.id_terminal AND carga.orden <= entrega.orden)
                    OR (carga.id_terminal_destino = t.id_terminal AND carga.orden < entrega.orden))
                    AND entrega.id_gasolinera_destino = t.id_gasolinera
            )
        ) THEN
            RAISE EXCEPTION 'El recorrido debe visitar el terminal antes de la gasolinera de cada entrega'
                USING ERRCODE = '23514', CONSTRAINT = 'viaje_recorrido_entregas';
        END IF;
    END LOOP;
    RETURN NULL;
END;
$$;
COMMIT;
