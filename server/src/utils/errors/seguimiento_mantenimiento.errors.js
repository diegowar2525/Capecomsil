const translateSeguimientoMantenimientoError = error => {
    if (error.constraint?.startsWith("seguimiento_")) {
        return { status: error.constraint === "seguimiento_referencia_invalida" ? 400 : 409, message: error.message };
    }
    if (["plan_mantenimiento_vehiculo","cumplimiento_plan_mantenimiento"].includes(error.table)) {
        if (error.code === "23505") return { status: 409, message: "Este plan ya está asociado al mantenimiento" };
        if (error.code === "23503") return { status: 409, message: "El registro está relacionado con planes o cumplimientos; conserve su historial" };
        if (["23514","23502","22003"].includes(error.code)) return { status: 400, message: "Valores del seguimiento de mantenimiento inválidos" };
    }
    return null;
};
module.exports = { translateSeguimientoMantenimientoError };
