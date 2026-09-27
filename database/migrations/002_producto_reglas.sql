BEGIN;

CREATE FUNCTION validar_reglas_producto() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE categoria_estado TEXT;
BEGIN
    IF TG_OP = 'INSERT' OR NEW.id_categoria IS DISTINCT FROM OLD.id_categoria THEN
        SELECT estado INTO categoria_estado FROM categoria_producto
            WHERE id_categoria = NEW.id_categoria FOR SHARE;
        IF FOUND AND categoria_estado <> 'ACTIVO' THEN
            RAISE EXCEPTION 'La categoría seleccionada debe estar activa'
                USING ERRCODE = '23514', CONSTRAINT = 'producto_categoria_activa';
        END IF;
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.unidad_medida IS DISTINCT FROM OLD.unidad_medida THEN
        IF EXISTS (SELECT 1 FROM detalle_factura_proveedor WHERE id_producto = OLD.id_producto)
            OR EXISTS (SELECT 1 FROM movimiento_inventario WHERE id_producto = OLD.id_producto)
            OR EXISTS (SELECT 1 FROM detalle_mantenimiento WHERE id_producto = OLD.id_producto) THEN
            RAISE EXCEPTION 'No se puede cambiar la unidad de un producto con historial'
                USING ERRCODE = '23514', CONSTRAINT = 'producto_unidad_historial';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER producto_validar_reglas BEFORE INSERT OR UPDATE ON producto
    FOR EACH ROW EXECUTE FUNCTION validar_reglas_producto();

-- Serializa la primera operación histórica con cambios de unidad del producto.
-- Las FK existentes bloquean su eliminación si hay historial.
CREATE FUNCTION bloquear_producto_historial() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    PERFORM 1 FROM producto WHERE id_producto = NEW.id_producto FOR UPDATE;
    RETURN NEW;
END;
$$;

CREATE TRIGGER compra_bloquear_producto BEFORE INSERT OR UPDATE OF id_producto ON detalle_factura_proveedor
    FOR EACH ROW EXECUTE FUNCTION bloquear_producto_historial();
CREATE TRIGGER movimiento_bloquear_producto BEFORE INSERT OR UPDATE OF id_producto ON movimiento_inventario
    FOR EACH ROW EXECUTE FUNCTION bloquear_producto_historial();
CREATE TRIGGER mantenimiento_bloquear_producto BEFORE INSERT OR UPDATE OF id_producto ON detalle_mantenimiento
    FOR EACH ROW EXECUTE FUNCTION bloquear_producto_historial();

COMMIT;
