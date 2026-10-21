BEGIN;
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(72631, 2);

CREATE TABLE usuario_historial (
    id_historial BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario),
    id_actor INTEGER NOT NULL REFERENCES usuario(id_usuario),
    accion TEXT NOT NULL CHECK (accion IN ('CREAR', 'EDITAR', 'ESTADO', 'RESTABLECER_PASSWORD')),
    motivo VARCHAR(500),
    anterior JSONB,
    posterior JSONB NOT NULL,
    fecha TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX idx_usuario_historial_usuario ON usuario_historial(id_usuario, id_historial DESC);

COMMIT;
