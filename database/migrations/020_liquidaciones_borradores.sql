BEGIN;
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(72631, 1);

ALTER TABLE liquidacion ADD COLUMN version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0);
INSERT INTO permiso(codigo, modulo, accion, exclusivo_jefe) VALUES
    ('liquidaciones.consultar', 'liquidaciones', 'consultar', true),
    ('liquidaciones.crear', 'liquidaciones', 'crear', true),
    ('liquidaciones.editar', 'liquidaciones', 'editar', true);
INSERT INTO rol_permiso(id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso FROM rol r CROSS JOIN permiso p
WHERE r.codigo='JEFE' AND p.modulo='liquidaciones';

COMMIT;
