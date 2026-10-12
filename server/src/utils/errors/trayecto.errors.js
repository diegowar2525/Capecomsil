const translateTrayectoError = (error) => {
    if (error.code === "23503" && error.constraint === "tramo_viaje_id_trayecto_fkey") {
        return { status: 409, message: "El trayecto tiene historial y no puede eliminarse; puede inactivarlo" };
    }
    if (error.code === "23503" && error.table === "trayecto") {
        return { status: 400, message: "El terminal o la gasolinera del trayecto no existe" };
    }
    if (error.code === "23514" && error.constraint === "trayecto_historial") {
        return { status: 409, message: "No se pueden cambiar las ubicaciones de un trayecto utilizado" };
    }
    return null;
};

module.exports = { translateTrayectoError };
