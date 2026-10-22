const translateLiquidacionError = (error) => {
    if (error.constraint?.startsWith("liquidacion_") || error.constraint?.startsWith("chk_liquidacion_")) {
        return { status: 409, message: "La liquidación o sus entregas no cumplen las condiciones requeridas" };
    }
    if (["liquidacion", "detalle_liquidacion"].includes(error.table)) {
        if (error.code === "23503") {
            return { status: 409, message: "La liquidación tiene referencias inexistentes o relacionadas con su historial" };
        }
        if (error.code === "23505") {
            return { status: 409, message: "La entrega ya está incluida en la liquidación" };
        }
    }
    return null;
};

module.exports = { translateLiquidacionError };
