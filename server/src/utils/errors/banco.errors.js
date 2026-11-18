const translateBancoError = error => {
    if (error.constraint === 'uq_banco_nombre') return { status: 409, message: 'Ya existe un banco con ese nombre.' };
    if (error.constraint === 'pago_id_banco_fkey') return { status: 409, message: 'El banco no existe o está asociado a cobros y no se puede eliminar.' };
    if (error.constraint === 'banco_activo') return { status: 400, message: 'Selecciona un banco activo.' };
    return null;
};
module.exports = { translateBancoError };
