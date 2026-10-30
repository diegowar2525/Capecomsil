import { validarFoto } from '../domain/foto.js';

// El registro y el archivo usan endpoints distintos. Recordar el ID incluso si
// falla R2 evita repetir un POST al reintentar una creación desde el mismo modal.
export async function guardarConFoto({ id, data, foto, api, rowKey, guardar, recordarRegistro, actualizarRegistro }) {
    validarFoto(foto.archivo);
    const registro = await guardar(id, data);
    recordarRegistro(registro[rowKey]);
    if (!foto.archivo && !foto.quitar) return registro;
    try {
        const actualizado = foto.archivo ? await api.guardar(registro[rowKey], foto.archivo)
            : await api.eliminar(registro[rowKey]);
        actualizarRegistro?.({ ...registro, ...actualizado });
        return actualizado;
    } catch (error) {
        // No se afirma que todo se revirtió: los datos del registro ya se guardaron.
        const failure = new Error(`Los datos se guardaron, pero no se pudo actualizar la foto. ${error.message} Puedes volver a guardar para reintentar sobre el mismo registro.`, { cause: error });
        failure.status = error.status;
        failure.field = 'foto';
        throw failure;
    }
}
