BEGIN;
-- Documentos históricos: saldos previos sin movimientos de caja ficticios.
ALTER TABLE factura
 ADD COLUMN historico boolean NOT NULL DEFAULT false,
 ADD COLUMN importe_pagado_previo numeric(14,2) NOT NULL DEFAULT 0,
 ADD COLUMN fecha_corte date,
 ADD COLUMN archivo_origen text,
 ADD COLUMN hoja_origen text,
 ADD COLUMN fila_origen integer,
 ADD COLUMN huella_origen varchar(64),
 ADD CONSTRAINT factura_origen_historico CHECK (
   (NOT historico AND importe_pagado_previo=0 AND fecha_corte IS NULL AND archivo_origen IS NULL AND hoja_origen IS NULL AND fila_origen IS NULL AND huella_origen IS NULL)
   OR (historico AND fecha_corte IS NOT NULL AND (importe_pagado_previo=0 OR fecha_emision<fecha_corte)
       AND NULLIF(btrim(archivo_origen),'') IS NOT NULL AND NULLIF(btrim(hoja_origen),'') IS NOT NULL
       AND fila_origen>0 AND fila_origen IS NOT NULL AND huella_origen ~ '^[a-f0-9]{64}$' AND huella_origen IS NOT NULL)),
 ADD CONSTRAINT factura_saldo_previo CHECK (importe_pagado_previo>=0 AND importe_pagado_previo<=valor_neto);
CREATE UNIQUE INDEX factura_fuente_unica ON factura(huella_origen,hoja_origen,fila_origen) WHERE historico;
ALTER TABLE factura_proveedor
 ADD COLUMN historico boolean NOT NULL DEFAULT false,
 ADD COLUMN importe_pagado_previo numeric(14,2) NOT NULL DEFAULT 0,
 ADD COLUMN fecha_corte date,
 ADD COLUMN archivo_origen text,
 ADD COLUMN hoja_origen text,
 ADD COLUMN fila_origen integer,
 ADD COLUMN huella_origen varchar(64),
 ADD CONSTRAINT factura_proveedor_origen_historico CHECK (
   (NOT historico AND importe_pagado_previo=0 AND fecha_corte IS NULL AND archivo_origen IS NULL AND hoja_origen IS NULL AND fila_origen IS NULL AND huella_origen IS NULL)
   OR (historico AND fecha_corte IS NOT NULL AND (importe_pagado_previo=0 OR fecha_emision<fecha_corte)
       AND NULLIF(btrim(archivo_origen),'') IS NOT NULL AND NULLIF(btrim(hoja_origen),'') IS NOT NULL
       AND fila_origen>0 AND fila_origen IS NOT NULL AND huella_origen ~ '^[a-f0-9]{64}$' AND huella_origen IS NOT NULL)),
 ADD CONSTRAINT factura_proveedor_saldo_previo CHECK (importe_pagado_previo>=0 AND importe_pagado_previo<=total);
CREATE UNIQUE INDEX factura_proveedor_fuente_unica ON factura_proveedor(huella_origen,hoja_origen,fila_origen) WHERE historico;
ALTER TABLE factura_proveedor ALTER COLUMN subtotal DROP NOT NULL;
ALTER TABLE factura_proveedor ALTER COLUMN descuento_total DROP NOT NULL;
ALTER TABLE factura_proveedor ALTER COLUMN impuestos DROP NOT NULL;
ALTER TABLE factura_proveedor ADD CONSTRAINT factura_proveedor_desglose CHECK (
 (historico AND subtotal IS NULL AND descuento_total IS NULL AND impuestos IS NULL AND total>=0)
 OR (subtotal IS NOT NULL AND descuento_total IS NOT NULL AND impuestos IS NOT NULL));
CREATE OR REPLACE FUNCTION proteger_factura_cliente() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF TG_OP='DELETE' THEN
        RAISE EXCEPTION 'Las facturas se anulan, no se eliminan' USING ERRCODE='23514', CONSTRAINT='factura_cliente_historial';
    END IF;
    IF TG_OP='INSERT' AND NEW.historico THEN
        IF NEW.estado NOT IN ('REGISTRADA','ANULADA') OR
           (NEW.estado='ANULADA' AND (NULLIF(btrim(NEW.motivo_anulacion),'') IS NULL OR NEW.importe_pagado_previo<>0)) THEN
            RAISE EXCEPTION 'Estado histórico inválido' USING ERRCODE='23514';
        END IF;
        RETURN NEW;
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
        IF OLD.importe_pagado_previo>0 OR EXISTS(SELECT 1 FROM pago WHERE id_factura=OLD.id_factura AND estado='REGISTRADO') THEN
            RAISE EXCEPTION 'La factura tiene cobros vigentes' USING ERRCODE='23514', CONSTRAINT='factura_cliente_cobros';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION validar_totales_factura_empresa() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE f factura%ROWTYPE; t record;
BEGIN
    SELECT * INTO f FROM factura WHERE id_factura=NEW.id_factura;
    SELECT count(*) cantidad,sum(l.valor_transporte+l.recargo) subtotal,sum(l.retencion) retencion,sum(l.total_liquidacion) neto
    INTO t FROM factura_liquidacion fl JOIN liquidacion l USING(id_liquidacion) WHERE fl.id_factura=f.id_factura;
    IF f.historico THEN
        IF t.cantidad<>0 THEN RAISE EXCEPTION 'Un documento histórico no admite liquidaciones' USING ERRCODE='23514'; END IF;
        RETURN NULL;
    END IF;
    IF t.cantidad=0 OR (f.subtotal,f.retencion,f.valor_neto) IS DISTINCT FROM (t.subtotal,t.retencion,t.neto) THEN
        RAISE EXCEPTION 'Importes inconsistentes con las liquidaciones' USING ERRCODE='23514',CONSTRAINT='factura_cliente_liquidacion';
    END IF;
    RETURN NULL;
END;
$$;
CREATE OR REPLACE FUNCTION proteger_cobro_cliente() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE f factura%ROWTYPE; cobrado NUMERIC;
BEGIN
    PERFORM pg_advisory_xact_lock(72631,1);
    IF TG_OP='DELETE' THEN
        RAISE EXCEPTION 'Los cobros se anulan, no se eliminan' USING ERRCODE='23514', CONSTRAINT='cobro_cliente_historial';
    END IF;
    SELECT * INTO f FROM factura WHERE id_factura=NEW.id_factura FOR UPDATE;
    IF TG_OP='INSERT' THEN
        SELECT COALESCE(sum(monto),0) INTO cobrado FROM pago WHERE id_factura=NEW.id_factura AND estado='REGISTRADO';
        IF f.estado IS DISTINCT FROM 'REGISTRADA' OR NEW.estado<>'REGISTRADO' OR NEW.monto>f.valor_neto-f.importe_pagado_previo-cobrado OR NEW.fecha_pago<f.fecha_emision OR (f.historico AND NEW.fecha_pago<f.fecha_corte)
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
CREATE FUNCTION proteger_documento_proveedor_historico() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN
   IF OLD.historico THEN RAISE EXCEPTION 'El documento histórico se conserva' USING ERRCODE='23514'; END IF;
   RETURN OLD;
 END IF;
 IF OLD.historico OR NEW.historico THEN
   IF (to_jsonb(NEW)-ARRAY['estado','fecha_anulacion','motivo_anulacion']) IS DISTINCT FROM
      (to_jsonb(OLD)-ARRAY['estado','fecha_anulacion','motivo_anulacion']) OR
      OLD.estado<>'REGISTRADA' OR NEW.estado<>'ANULADA' OR OLD.importe_pagado_previo>0 OR
      NEW.fecha_anulacion IS NULL OR NULLIF(btrim(NEW.motivo_anulacion),'') IS NULL OR
      EXISTS(SELECT 1 FROM pago_proveedor WHERE id_factura_proveedor=OLD.id_factura_proveedor AND estado='REGISTRADO') THEN
       RAISE EXCEPTION 'Documento histórico inmutable o con pagos previos/vigentes' USING ERRCODE='23514';
   END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER documento_proveedor_historico_guard BEFORE UPDATE OR DELETE ON factura_proveedor
FOR EACH ROW EXECUTE FUNCTION proteger_documento_proveedor_historico();
CREATE FUNCTION impedir_detalle_historico() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM factura_proveedor WHERE id_factura_proveedor=NEW.id_factura_proveedor AND historico) THEN
  RAISE EXCEPTION 'Un documento histórico no admite detalles inventados ni recepciones' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER detalle_historico_guard BEFORE INSERT OR UPDATE ON detalle_factura_proveedor
FOR EACH ROW EXECUTE FUNCTION impedir_detalle_historico();
CREATE TRIGGER recepcion_historica_guard BEFORE INSERT OR UPDATE ON recepcion_compra
FOR EACH ROW EXECUTE FUNCTION impedir_detalle_historico();
CREATE FUNCTION validar_pago_proveedor_historico() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE f factura_proveedor%ROWTYPE; pagado numeric;
BEGIN
 SELECT * INTO f FROM factura_proveedor WHERE id_factura_proveedor=NEW.id_factura_proveedor FOR UPDATE;
 IF f.historico AND NEW.estado='REGISTRADO' THEN
  SELECT COALESCE(sum(monto),0) INTO pagado FROM pago_proveedor
   WHERE id_factura_proveedor=f.id_factura_proveedor AND estado='REGISTRADO' AND id_pago_proveedor<>NEW.id_pago_proveedor;
  IF f.estado='ANULADA' OR NEW.fecha_pago<f.fecha_corte OR NEW.monto>f.total-f.importe_pagado_previo-pagado THEN
   RAISE EXCEPTION 'Pago fuera del período o saldo histórico' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER pago_proveedor_historico_guard BEFORE INSERT OR UPDATE ON pago_proveedor
FOR EACH ROW EXECUTE FUNCTION validar_pago_proveedor_historico();
COMMIT;
