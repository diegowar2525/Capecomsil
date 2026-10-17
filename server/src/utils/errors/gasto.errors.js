const translateGastoError = error => {
    if (["gasto", "abastecimiento_combustible"].includes(error.table)) {
        if (error.code === "23503") return { status: 409, message: "El gasto o abastecimiento tiene referencias inexistentes o conserva historial relacionado" };
        if (error.code === "23505") return { status: 409, message: "El gasto ya está asociado a un abastecimiento" };
        if (["23514", "23502", "22003"].includes(error.code)) return { status: 400, message: "Valores del gasto o abastecimiento inválidos" };
    }
    return null;
};
module.exports = { translateGastoError };
