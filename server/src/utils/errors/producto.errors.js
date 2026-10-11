const translateProductoError = (error) => {
    if (error.code === "23503") {
        if (error.constraint === "fk_producto_categoria") {
            return {
                status: 400,
                message: "La categoría no existe o tiene productos asociados que impiden eliminarla"
            };
        }

        if ([
            "fk_detalle_factura_proveedor_producto",
            "fk_movimiento_producto",
            "fk_detalle_mantenimiento_producto"
        ].includes(error.constraint)) {
            return {
                status: 409,
                message: "La operación no permite mantener la relación del producto con su historial"
            };
        }
    }

    if (error.code === "23514") {
        const mensajes = {
            producto_condicion_categoria: "Las llantas requieren condición NUEVA o REENCAUCHADA; otros productos no admiten condición",
            chk_producto_condicion_llanta: "La condición debe ser NUEVA o REENCAUCHADA",
            producto_presentacion_historial: "No se puede cambiar medida o condición de un producto con historial",
            categoria_tipo_historial: "No se puede cambiar es_llanta en una categoría con productos",
            chk_detalle_mantenimiento_origen: "Indique un producto de inventario o la descripción de un material externo",
            movimiento_material: "El movimiento no corresponde al material de inventario",
            material_historial: "No se puede modificar un material que ya generó movimientos",
            producto_categoria_activa: "La categoría seleccionada debe estar activa",
            producto_unidad_historial: "No se puede cambiar la unidad de medida de un producto con historial",
            chk_producto_stock_minimo: "El stock mínimo no puede ser negativo"
        };

        if (Object.hasOwn(mensajes, error.constraint)) {
            return {
                status: 409,
                message: mensajes[error.constraint]
            };
        }
    }

    return null;
};

module.exports = {
    translateProductoError
};
