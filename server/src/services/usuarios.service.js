const usuarioModel = require("../models/usuario.model");
const { validateId } = require("../utils/validators/common.validators");
const { validateFiltros } = require("../utils/validators/usuario.validators");
const { createHttpError } = require("../utils/errors/http.error");
const pool = require("../config/database");
const rolModel = require("../models/rol.model");
const rolPermisoModel = require("../models/rol_permiso.model");
const sesionModel = require("../models/sesion.model");
const historialModel = require("../models/usuario_historial.model");
const { hashPassword } = require("../utils/password");
const { validatePerfil, validateCreacion, validateEdicion, validateEstado, validateRestablecimiento } = require("../utils/validators/usuario.validators");

// Lista explícita: nunca serializar credenciales ni cuerpos HTTP en el historial.
const snapshot = (usuario) => {
    if (!usuario) {
        return null;
    }
    return {
        nombre_usuario: usuario.nombre_usuario, nombre: usuario.nombre, correo: usuario.correo, imagen_url: usuario.imagen_url,
        id_rol: usuario.id_rol, activo: usuario.activo,
        requiere_cambio_password: usuario.requiere_cambio_password
    };
};

const administrar = async (idActor, id, permiso, accion, motivo, operacion) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        // Serializa cambios administrativos para proteger al último jefe concurrentemente.
        await usuarioModel.lockAdministracion(client);
        const actor = await usuarioModel.findByIdForUpdate(client, idActor);
        const permisos = actor ? await rolPermisoModel.findByRol(actor.id_rol, client) : [];
        if (!actor?.activo || actor.rol !== "JEFE" || actor.requiere_cambio_password
            || !permisos.some((item) => item.codigo === permiso)) {
            throw createHttpError("No tiene permiso para administrar usuarios", 403);
        }
        const anterior = id === null ? null : await usuarioModel.findByIdForUpdate(client, id);
        if (id !== null && !anterior) {
            throw createHttpError("Usuario no encontrado", 404);
        }
        const idUsuario = await operacion(client, anterior);
        const resultado = await usuarioModel.findById(idUsuario, client);
        await historialModel.create(client, {
            id_usuario: idUsuario, id_actor: idActor, accion, motivo,
            anterior: snapshot(anterior), posterior: snapshot(resultado)
        });
        await client.query("COMMIT");
        return resultado;
    } catch (error) {
        await client.query("ROLLBACK");
        if (error.code === "23505" && error.constraint === "usuario_nombre_usuario_key") {
            throw createHttpError("El nombre de usuario ya está registrado", 409);
        }
        throw error;
    } finally {
        client.release();
    }
};

const protegerUltimoJefe = async (client, anterior, pierdeJefatura) => {
    if (anterior.activo && anterior.rol === "JEFE" && pierdeJefatura
        && await usuarioModel.countJefesActivos(client) <= 1) {
        throw createHttpError("No se puede desactivar ni cambiar el rol del último jefe activo", 409);
    }
};

const create = async (data, idActor) => {
    const datosValidados = validateCreacion(data);
    const passwordHash = await hashPassword(datosValidados.password_temporal);
    return administrar(idActor, null, "usuarios.crear", "CREAR", null, async (client) => {
        if (!await rolModel.findById(datosValidados.id_rol, client)) {
            throw createHttpError("Rol no encontrado", 404);
        }
        const creado = await usuarioModel.create(client, { ...datosValidados, password_hash: passwordHash });
        return creado.id_usuario;
    });
};

const update = async (id, data, idActor) => {
    const idUsuario = validateId(id);
    const datosValidados = validateEdicion(data);
    return administrar(idActor, idUsuario, "usuarios.editar", "EDITAR", null, async (client, anterior) => {
        const rol = await rolModel.findById(datosValidados.id_rol, client);
        if (!rol) {
            throw createHttpError("Rol no encontrado", 404);
        }
        await protegerUltimoJefe(client, anterior, rol.codigo !== "JEFE");
        await usuarioModel.update(client, idUsuario, { ...anterior, ...datosValidados });
        if (anterior.id_rol !== datosValidados.id_rol || anterior.nombre_usuario !== datosValidados.nombre_usuario) {
            await sesionModel.revocarByUsuario(client, idUsuario);
        }
        return idUsuario;
    });
};

const updateEstado = async (id, data, idActor) => {
    const idUsuario = validateId(id);
    const datosValidados = validateEstado(data);
    return administrar(idActor, idUsuario, "usuarios.desactivar", "ESTADO", datosValidados.motivo, async (client, anterior) => {
        await protegerUltimoJefe(client, anterior, !datosValidados.activo);
        await usuarioModel.updateEstado(client, idUsuario, datosValidados.activo);
        if (!datosValidados.activo) {
            await sesionModel.revocarByUsuario(client, idUsuario);
        }
        return idUsuario;
    });
};

const resetPassword = async (id, data, idActor) => {
    const idUsuario = validateId(id);
    const datosValidados = validateRestablecimiento(data);
    if (idUsuario === idActor) {
        throw createHttpError("Para cambiar su propia contraseña utilice /api/auth/password", 409);
    }
    const passwordHash = await hashPassword(datosValidados.password_temporal);
    return administrar(idActor, idUsuario, "usuarios.restablecer_credenciales", "RESTABLECER_PASSWORD", datosValidados.motivo, async (client) => {
        await usuarioModel.resetPassword(client, idUsuario, passwordHash);
        await sesionModel.revocarByUsuario(client, idUsuario);
        return idUsuario;
    });
};

const findHistorial = async (id) => {
    const usuario = await findById(id);
    return historialModel.findByUsuario(usuario.id_usuario);
};

const findAll = async (query) => {
    const datosValidados = validateFiltros(query);
    return usuarioModel.findAll(datosValidados);
};

const findById = async (id) => {
    const resultado = await usuarioModel.findById(validateId(id));
    if (!resultado) {
        throw createHttpError("Usuario no encontrado", 404);
    }
    return resultado;
};

// El identificador proviene de la sesión autenticada, nunca del cuerpo o de parámetros.
const updatePerfil = async (idActor, data) => {
    const id = validateId(idActor);
    const datosValidados = validatePerfil(data);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await usuarioModel.lockAdministracion(client);
        const anterior = await usuarioModel.findByIdForUpdate(client, id);
        if (!anterior?.activo) throw createHttpError("Sesión inválida o vencida", 401);
        if (anterior.requiere_cambio_password) throw createHttpError("Debe cambiar su contraseña antes de continuar", 403);
        await usuarioModel.updatePerfil(client, id, { ...anterior, ...datosValidados });
        const resultado = await usuarioModel.findById(id, client);
        await historialModel.create(client, { id_usuario: id, id_actor: id, accion: "EDITAR",
            motivo: "Actualización del perfil propio", anterior: snapshot(anterior), posterior: snapshot(resultado) });
        await client.query("COMMIT");
        return resultado;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    updatePerfil,
    create,
    update,
    updateEstado,
    resetPassword,
    findHistorial,
    findAll,
    findById
};
