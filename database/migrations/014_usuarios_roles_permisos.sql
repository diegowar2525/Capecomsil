BEGIN;
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(72631,1);

-- Usuarios y permisos: estructura inicial. No crea cuentas ni sesiones.
CREATE TABLE rol (
    id_rol INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    CONSTRAINT rol_codigo CHECK (codigo IN ('JEFE', 'OPERADOR')),
    CONSTRAINT rol_nombre CHECK (btrim(nombre) <> '')
);

CREATE TABLE permiso (
    id_permiso INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(100) NOT NULL UNIQUE,
    modulo VARCHAR(50) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    exclusivo_jefe BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT permiso_codigo CHECK (codigo = modulo || '.' || accion),
    CONSTRAINT permiso_nombres CHECK (
        modulo ~ '^[a-z][a-z_]*$' AND accion ~ '^[a-z][a-z_]*$'
    )
);

CREATE TABLE rol_permiso (
    id_rol INTEGER NOT NULL REFERENCES rol(id_rol),
    id_permiso INTEGER NOT NULL REFERENCES permiso(id_permiso),
    PRIMARY KEY (id_rol, id_permiso)
);
CREATE INDEX idx_rol_permiso_permiso ON rol_permiso(id_permiso);

CREATE TABLE usuario (
    id_usuario INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    password_hash TEXT NOT NULL,
    id_rol INTEGER NOT NULL REFERENCES rol(id_rol),
    activo BOOLEAN NOT NULL DEFAULT true,
    requiere_cambio_password BOOLEAN NOT NULL DEFAULT true,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT usuario_nombre_usuario CHECK (nombre_usuario ~ '^[a-z0-9][a-z0-9._-]{2,49}$'),
    CONSTRAINT usuario_nombre CHECK (btrim(nombre) <> ''),
    CONSTRAINT usuario_password_hash CHECK (btrim(password_hash) <> ''),
    CONSTRAINT usuario_fechas CHECK (fecha_actualizacion >= fecha_creacion)
);
CREATE INDEX idx_usuario_rol ON usuario(id_rol);
COMMENT ON COLUMN usuario.password_hash IS 'Hash de contraseña; nunca contraseña en texto plano. Algoritmo a implementar con autenticación.';

CREATE TABLE sesion (
    id_sesion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario),
    token_hash BYTEA NOT NULL UNIQUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMPTZ NOT NULL,
    fecha_revocacion TIMESTAMPTZ,
    CONSTRAINT sesion_token_hash CHECK (octet_length(token_hash) = 32),
    CONSTRAINT sesion_fechas CHECK (
        fecha_expiracion > fecha_creacion
        AND (fecha_revocacion IS NULL OR fecha_revocacion >= fecha_creacion)
    )
);
CREATE INDEX idx_sesion_usuario ON sesion(id_usuario);
CREATE INDEX idx_sesion_expiracion ON sesion(fecha_expiracion) WHERE fecha_revocacion IS NULL;
COMMENT ON COLUMN sesion.token_hash IS 'Resumen de 32 bytes del token; nunca el token de la cookie.';

INSERT INTO rol (codigo, nombre) VALUES ('JEFE', 'Jefe'), ('OPERADOR', 'Operador');
INSERT INTO permiso (codigo, modulo, accion, exclusivo_jefe) VALUES
    ('viajes.consultar', 'viajes', 'consultar', false),
    ('viajes.crear', 'viajes', 'crear', false),
    ('viajes.editar', 'viajes', 'editar', false),
    ('viajes.anular', 'viajes', 'anular', false),
    ('compras.consultar', 'compras', 'consultar', false),
    ('compras.crear', 'compras', 'crear', false),
    ('compras.anular', 'compras', 'anular', false),
    ('recepciones.consultar', 'recepciones', 'consultar', false),
    ('recepciones.crear', 'recepciones', 'crear', false),
    ('recepciones.anular', 'recepciones', 'anular', false),
    ('inventario.consultar', 'inventario', 'consultar', false),
    ('inventario.ajustar', 'inventario', 'ajustar', false),
    ('inventario.revertir', 'inventario', 'revertir', false),
    ('mantenimientos.consultar', 'mantenimientos', 'consultar', false),
    ('mantenimientos.crear', 'mantenimientos', 'crear', false),
    ('mantenimientos.finalizar', 'mantenimientos', 'finalizar', false),
    ('mantenimientos.anular', 'mantenimientos', 'anular', false),
    ('mantenimientos.registrar_cumplimientos', 'mantenimientos', 'registrar_cumplimientos', false),
    ('planes_mantenimiento.consultar', 'planes_mantenimiento', 'consultar', false),
    ('planes_mantenimiento.crear', 'planes_mantenimiento', 'crear', false),
    ('planes_mantenimiento.editar', 'planes_mantenimiento', 'editar', false),
    ('planes_mantenimiento.eliminar', 'planes_mantenimiento', 'eliminar', false),
    ('gastos.consultar', 'gastos', 'consultar', false),
    ('gastos.crear', 'gastos', 'crear', false),
    ('gastos.anular', 'gastos', 'anular', false),
    ('abastecimientos.consultar', 'abastecimientos', 'consultar', false),
    ('abastecimientos.crear', 'abastecimientos', 'crear', false),
    ('abastecimientos.anular', 'abastecimientos', 'anular', false),
    ('pagos_proveedor.consultar', 'pagos_proveedor', 'consultar', false),
    ('pagos_proveedor.crear', 'pagos_proveedor', 'crear', false),
    ('pagos_proveedor.anular', 'pagos_proveedor', 'anular', false),
    ('catalogos.consultar', 'catalogos', 'consultar', false),
    ('catalogos.crear', 'catalogos', 'crear', false),
    ('catalogos.editar', 'catalogos', 'editar', false),
    ('catalogos.eliminar', 'catalogos', 'eliminar', false),
    ('informes.consultar', 'informes', 'consultar', false),
    ('remuneraciones.consultar', 'remuneraciones', 'consultar', false),
    ('remuneraciones.generar', 'remuneraciones', 'generar', false),
    ('tarifas.consultar', 'tarifas', 'consultar', false),
    ('tarifas.crear', 'tarifas', 'crear', true),
    ('tarifas.editar', 'tarifas', 'editar', true),
    ('tarifas.eliminar', 'tarifas', 'eliminar', true),
    ('configuraciones.consultar', 'configuraciones', 'consultar', false),
    ('configuraciones.crear', 'configuraciones', 'crear', true),
    ('configuraciones.editar', 'configuraciones', 'editar', true),
    ('configuraciones.eliminar', 'configuraciones', 'eliminar', true),
    ('usuarios.consultar', 'usuarios', 'consultar', true),
    ('usuarios.crear', 'usuarios', 'crear', true),
    ('usuarios.editar', 'usuarios', 'editar', true),
    ('usuarios.desactivar', 'usuarios', 'desactivar', true),
    ('usuarios.restablecer_credenciales', 'usuarios', 'restablecer_credenciales', true),
    ('roles.consultar', 'roles', 'consultar', true),
    ('roles.asignar', 'roles', 'asignar', true),
    ('permisos.consultar', 'permisos', 'consultar', true),
    ('permisos.asignar', 'permisos', 'asignar', true),
    ('cierres.consultar', 'cierres', 'consultar', false),
    ('cierres.cerrar', 'cierres', 'cerrar', true),
    ('cierres.reabrir', 'cierres', 'reabrir', true),
    ('importaciones.consultar', 'importaciones', 'consultar', true),
    ('importaciones.ejecutar', 'importaciones', 'ejecutar', true);

INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM rol r CROSS JOIN permiso p
WHERE r.codigo = 'JEFE' OR NOT p.exclusivo_jefe;

COMMIT;
