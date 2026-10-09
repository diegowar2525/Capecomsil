const translateTarifaError = (error) => {
    if (
        error.code === "23P01" &&
        error.constraint === "tarifa_sin_solapamientos"
    ) {
        return {
            status: 409,
            message: "El período se superpone con otra tarifa de la misma gasolinera y terminal"
        };
    }

    if (error.code === "23503") {
        if (error.constraint === "fk_detalle_viaje_tarifa") {
            return {
                status: 409,
                message: "La operación viola la relación entre viajes y tarifas: la tarifa está utilizada o no existe"
            };
        }

        if (
            error.constraint === "fk_tarifa_gasolinera" ||
            error.constraint === "fk_tarifa_terminal"
        ) {
            return {
                status: 400,
                message: "La gasolinera o el terminal indicado no existe"
            };
        }
    }

    if (error.code === "23514") {
        if (error.constraint === "tarifa_historial") {
            return {
                status: 409,
                message: "No se puede cambiar el valor o la combinación de una tarifa utilizada, ni excluir fechas de sus viajes"
            };
        }

        if (error.constraint === "viaje_tarifa_vigente") {
            return {
                status: 409,
                message: "La tarifa no cubre la fecha del viaje"
            };
        }

        if (
            error.constraint === "chk_tarifa_valor" ||
            error.constraint === "chk_tarifa_fechas"
        ) {
            return {
                status: 409,
                message: "Los datos no cumplen las restricciones de la tarifa"
            };
        }
    }

    return null;
};

module.exports = {
    translateTarifaError
};
