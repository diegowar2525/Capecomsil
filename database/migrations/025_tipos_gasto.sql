BEGIN;
-- Catálogo administrable. El código conserva el contrato y las reglas históricas de gasto.
CREATE TABLE tipo_gasto (
    id_tipo_gasto SERIAL PRIMARY KEY,
    codigo VARCHAR(100) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado BOOLEAN NOT NULL DEFAULT TRUE,
    reservado BOOLEAN NOT NULL DEFAULT FALSE
);
INSERT INTO tipo_gasto(codigo,nombre,reservado) VALUES
    ('VIATICO','Viático',TRUE), ('COMBUSTIBLE','Combustible',TRUE);
-- Conserva cada código existente sin modificar importes ni registros históricos.
INSERT INTO tipo_gasto(codigo,nombre)
SELECT DISTINCT tipo_gasto,tipo_gasto FROM gasto
ON CONFLICT(codigo) DO NOTHING;
ALTER TABLE gasto ADD CONSTRAINT gasto_tipo_gasto_fkey
    FOREIGN KEY(tipo_gasto) REFERENCES tipo_gasto(codigo) ON UPDATE RESTRICT ON DELETE RESTRICT;
COMMIT;
