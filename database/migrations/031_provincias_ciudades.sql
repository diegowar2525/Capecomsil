BEGIN;
CREATE TABLE provincia (
    id_provincia SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL CHECK (btrim(nombre) <> ''),
    estado BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE UNIQUE INDEX uq_provincia_nombre ON provincia (lower(btrim(nombre)));
CREATE TABLE ciudad (
    id_ciudad SERIAL PRIMARY KEY,
    id_provincia INTEGER NOT NULL REFERENCES provincia(id_provincia) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL CHECK (btrim(nombre) <> ''),
    estado BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE UNIQUE INDEX uq_ciudad_provincia_nombre ON ciudad (id_provincia, lower(btrim(nombre)));
ALTER TABLE gasolinera ADD COLUMN id_ciudad INTEGER REFERENCES ciudad(id_ciudad) ON DELETE RESTRICT;
ALTER TABLE terminal ADD COLUMN id_ciudad INTEGER REFERENCES ciudad(id_ciudad) ON DELETE RESTRICT;
CREATE INDEX idx_gasolinera_ciudad ON gasolinera(id_ciudad);
CREATE INDEX idx_terminal_ciudad ON terminal(id_ciudad);
COMMIT;
