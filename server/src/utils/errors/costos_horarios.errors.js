const translateCostosHorariosError = (error) => {
    if (error.constraint?.startsWith("horario_")) {
        return { status: 409, message: error.code === "23P01"
            ? "El horario coincide con otra operación del vehículo o del chofer" : error.message };
    }
    if (error.constraint === "costos_configuracion_historial") return { status: 409, message: error.message };
    if (["configuracion_combustible", "configuracion_viatico", "configuracion_peaje_trayecto"].includes(error.table)) {
        if (error.code === "23P01") return { status: 409, message: "Las vigencias de esta configuración no pueden superponerse" };
        if (error.code === "23503") return { status: 409, message: "El registro tiene configuraciones de costos asociadas y no se puede eliminar" };
        if (["23514", "23502", "22003"].includes(error.code)) return { status: 400, message: "Valores de configuración inválidos" };
    }
    return null;
};
module.exports = { translateCostosHorariosError };
