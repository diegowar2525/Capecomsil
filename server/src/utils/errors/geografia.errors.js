const translateGeografiaError = (error) => {
    if (["uq_provincia_nombre", "uq_ciudad_provincia_nombre"].includes(error.constraint)) {
        return { status: 409, message: "Ya existe ese nombre de provincia o ciudad dentro de la provincia seleccionada" };
    }
    if (["ciudad_id_provincia_fkey", "gasolinera_id_ciudad_fkey", "terminal_id_ciudad_fkey"].includes(error.constraint)) {
        return { status: 409, message: "La provincia o ciudad no existe, o está en uso y no se puede eliminar" };
    }
    return null;
};
module.exports = { translateGeografiaError };
