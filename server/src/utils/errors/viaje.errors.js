const translateViajeError = (error) => {
    if (error.code === "23503" && error.table === "tramo_viaje") {
        return { status: 400, message: "El terminal o la gasolinera de un tramo no existe" };
    }
    if (error.code === "23514") {
        const mensajes = {
            viaje_recorrido: "El recorrido debe empezar en una gasolinera hacia un terminal y ser continuo y consecutivo",
            viaje_recorrido_entregas: "El recorrido debe visitar el terminal antes de cada entrega",
            chk_viaje_fechas: "La fecha de fin no puede ser anterior al inicio"
        };
        if (Object.hasOwn(mensajes, error.constraint)) return { status: 400, message: mensajes[error.constraint] };
    }
    return null;
};

module.exports = { translateViajeError };
