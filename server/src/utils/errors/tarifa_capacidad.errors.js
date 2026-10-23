const translateTarifaCapacidadError = (error) => {
    if (["modalidad_sin_solapamientos", "tarifa_capacidad_sin_solapamientos"].includes(error.constraint)) {
        return {
            status: 409,
            message: "La vigencia se superpone con otro registro de la misma gasolinera y capacidad o modalidad"
        };
    }

    if (["modalidad_historial", "tarifa_capacidad_historial"].includes(error.constraint)) {
        return {
            status: 409,
            message: "El cambio afectaría viajes ya registrados; conserve sus valores y vigencias históricas"
        };
    }

    if (["viaje_modalidad_tarifa", "modalidad_no_vigente", "detalle_tarifa_exclusiva"].includes(error.constraint)) {
        return {
            status: 409,
            message: "La modalidad o tarifa no corresponde a la gasolinera, fecha y capacidad del viaje"
        };
    }

    if (error.code === "23503"
        && /^(tarifa_capacidad_|modalidad_tarifa_gasolinera_|detalle_viaje_id_(tarifa_capacidad|modalidad_tarifa|gasolinera|terminal))/.test(error.constraint ?? "")) {
        return {
            status: 409,
            message: "El registro está utilizado por un viaje o la referencia indicada no existe"
        };
    }

    if (error.code === "23514" && /^(tarifa_capacidad_|modalidad_)/.test(error.constraint ?? "")) {
        return {
            status: 400,
            message: "Capacidad, modalidad o vigencia no válida"
        };
    }

    return null;
};

module.exports = { translateTarifaCapacidadError };
