BEGIN;
-- Conserva los importes históricos. La nueva regla se aplica al guardar borradores.
ALTER TABLE liquidacion ADD COLUMN recargos jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN tasa_retencion numeric(4,2) NOT NULL DEFAULT 0;
ALTER TABLE liquidacion ADD CONSTRAINT liquidacion_recargos_lista CHECK(jsonb_typeof(recargos)='array'),
    ADD CONSTRAINT liquidacion_tasa_retencion CHECK(tasa_retencion IN (0,0.01));
COMMIT;
