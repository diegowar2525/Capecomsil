const { randomUUID } = require("node:crypto");
const pool = require("../config/database");
const { getConfig } = require("../config/almacenamiento");
const usuarioModel = require("../models/usuario.model");
const fotoModel = require("../models/usuario_foto.model");
const archivoModel = require("../models/archivo.model");
const historialModel = require("../models/usuario_historial.model");
const almacenamiento = require("./almacenamiento.service");
const { prepararFoto } = require("./imagen.service");
const { validateId } = require("../utils/validators/common.validators");
const { createHttpError } = require("../utils/errors/http.error");

const actualizar = async (idUsuario, foto) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query("SET LOCAL lock_timeout = '5s'");
        await usuarioModel.lockAdministracion(client);
        const anterior = await usuarioModel.findByIdForUpdate(client, idUsuario);
        if (!anterior?.activo) throw createHttpError("Sesión inválida o vencida", 401);
        if (anterior.requiere_cambio_password) throw createHttpError("Debe cambiar su contraseña antes de continuar", 403);
        // El trigger encola el archivo anterior dentro de esta misma transacción.
        await usuarioModel.updatePerfil(client, idUsuario, { ...anterior, imagen_url: foto?.url ?? null });
        if (foto) {
            await fotoModel.create(client, { id_usuario: idUsuario, ...foto });
            await archivoModel.cancelarBorrado(client, foto.clave);
        }
        const resultado = await usuarioModel.findById(idUsuario, client);
        await historialModel.create(client, {
            id_usuario: idUsuario, id_actor: idUsuario, accion: "EDITAR",
            motivo: foto ? "Actualización de foto de perfil" : "Eliminación de foto de perfil",
            anterior: { imagen_url: anterior.imagen_url }, posterior: { imagen_url: resultado.imagen_url }
        });
        await client.query("COMMIT");
        return resultado;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const guardar = async (idUsuario, file) => {
    const id = validateId(idUsuario);
    const config = getConfig();
    const buffer = await prepararFoto(file);
    const version = randomUUID();
    const clave = `perfiles/${id}/${version}.webp`;
    // Se registra antes de subir: una caída o rollback no deja objetos olvidados.
    await archivoModel.programarBorrado(clave);
    await almacenamiento.guardar(clave, buffer);
    return await actualizar(id, {
        clave, url: `${config.apiUrl}/api/auth/fotos/${id}?v=${version}`
    });
};

const eliminar = async (idUsuario) => {
    const id = validateId(idUsuario);
    return await actualizar(id, null);
};

const consultar = async (idUsuario) => {
    const id = validateId(idUsuario);
    const foto = await fotoModel.findByUsuario(id);
    if (!foto) throw createHttpError("Foto no encontrada", 404);
    return await almacenamiento.obtener(foto.clave);
};

module.exports = { guardar, eliminar, consultar };
