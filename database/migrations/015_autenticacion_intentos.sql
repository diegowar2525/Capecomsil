BEGIN;
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(72631, 2);

CREATE TABLE autenticacion_intento (
    clave_hash BYTEA PRIMARY KEY CHECK (octet_length(clave_hash) = 32),
    intentos INTEGER NOT NULL CHECK (intentos > 0),
    fecha_limite TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_autenticacion_intento_limite ON autenticacion_intento(fecha_limite);

COMMENT ON COLUMN usuario.password_hash IS 'Hash scrypt con parámetros y sal; nunca contraseña en texto plano.';

COMMIT;
