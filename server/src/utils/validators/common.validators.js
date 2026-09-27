const validateId = (id) => {
    const idNumerico = Number(id);

    if (
        !["string", "number"].includes(typeof id) ||
        !/^\d+$/.test(String(id)) ||
        !Number.isSafeInteger(idNumerico) ||
        idNumerico <= 0 ||
        idNumerico > 2147483647
    ) {
        const error = new Error("El ID debe ser un entero positivo válido");
        error.status = 400;
        throw error;
    }

    return idNumerico;
};

module.exports = {
    validateId
};
