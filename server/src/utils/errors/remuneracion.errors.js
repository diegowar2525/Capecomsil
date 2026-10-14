const translateRemuneracionError = (error) => {
    if (error.constraint?.startsWith("remuneracion_")) {
        if (error.constraint === "remuneracion_vigencias") return { status: 409, message: "Las vigencias de remuneración no pueden superponerse" };
        return { status: error.constraint === "remuneracion_chofer_invalido" ? 400 : 409, message: error.message };
    }
    if (error.constraint === "feriado_fecha_key") return { status: 409, message: "Ya existe un feriado en esa fecha" };
    if (error.code === "23503" && error.table === "remuneracion_chofer") {
        return { status: 409, message: "El registro está utilizado en remuneraciones y no se puede eliminar" };
    }
    return null;
};
module.exports = { translateRemuneracionError };
