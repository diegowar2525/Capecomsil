const validateId = (id) => {
    const idNumerico = Number(id);

    if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
        const error = new Error("El ID del chofer no es válido.");
        error.status = 400;
        throw error;
    }

    return idNumerico;
};

module.exports = { validateId };