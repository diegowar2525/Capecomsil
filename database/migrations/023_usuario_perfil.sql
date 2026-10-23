BEGIN;
SET LOCAL lock_timeout = '10s';
ALTER TABLE usuario ADD COLUMN correo VARCHAR(254), ADD COLUMN imagen_url VARCHAR(2048);
COMMENT ON COLUMN usuario.imagen_url IS 'URL HTTP/HTTPS de la foto de perfil; NULL si no tiene foto.';
COMMIT;
