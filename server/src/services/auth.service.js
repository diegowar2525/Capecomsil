const { createHash, randomBytes } = require("node:crypto");
const pool = require("../config/database");
const config = require("../config/auth");
const authModel = require("../models/auth.model");
const usuarioModel = require("../models/usuario.model");
const sesionModel = require("../models/sesion.model");
const rolPermisoModel = require("../models/rol_permiso.model");
const intentoModel = require("../models/autenticacion_intento.model");
const { hashPassword, verifyPassword } = require("../utils/password");
const { validateLogin, validateCambioPassword, validatePrimerJefe } = require("../utils/validators/auth.validators");
const { createHttpError } = require("../utils/errors/http.error");

const digest = (value) => {
    return createHash("sha256").update(value).digest();
};

const limitarIntentos = async (ip, cuenta, operacion) => {
    await intentoModel.limpiarVencidos();
    const ipIntentos = await intentoModel.registrar(digest(`${operacion}:ip:${ip}`));
    if (ipIntentos > 30) {
        const error = createHttpError("Se alcanzó el límite de intentos. Espera antes de volver a intentar.", 429);
        error.retryAfter = await intentoModel.consultarEspera(digest(`${operacion}:ip:${ip}`));
        throw error;
    }
    const cuentaIntentos = await intentoModel.registrar(digest(`${operacion}:cuenta:${cuenta}`));
    if (cuentaIntentos > 10) {
        const error = createHttpError("Se alcanzó el límite de intentos. Espera antes de volver a intentar.", 429);
        error.retryAfter = await intentoModel.consultarEspera(digest(`${operacion}:cuenta:${cuenta}`));
        throw error;
    }
};

const login = async (data, ip, tokenAnterior) => {
    const datosValidados = validateLogin(data);
    await limitarIntentos(ip, datosValidados.nombre_usuario, "login");
    const credenciales = await authModel.findCredenciales(datosValidados.nombre_usuario);
    const valida = await verifyPassword(datosValidados.password, credenciales?.password_hash);
    if (!valida || !credenciales?.activo) {
        throw createHttpError("Usuario o contraseña incorrectos", 401);
    }
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const actual = await authModel.findUsuarioForUpdate(client, credenciales.id_usuario);
        if (!actual?.activo || actual.password_hash !== credenciales.password_hash) {
            throw createHttpError("Usuario o contraseña incorrectos", 401);
        }
        const token = randomBytes(32).toString("hex");
        const sesion = await sesionModel.create(client, {
            id_usuario: actual.id_usuario, token_hash: digest(token), segundos: config.sessionSeconds
        });
        if (tokenAnterior) {
            await sesionModel.revocar(digest(tokenAnterior), client);
        }
        const usuario = await usuarioModel.findById(actual.id_usuario, client);
        await client.query("COMMIT");
        return { token, usuario, fecha_expiracion: sesion.fecha_expiracion };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const autenticar = async (token) => {
    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
        throw createHttpError("Debe iniciar sesión", 401);
    }
    const sesion = await sesionModel.findVigente(digest(token));
    if (!sesion) {
        throw createHttpError("Sesión inválida o vencida", 401);
    }
    const usuario = await usuarioModel.findById(sesion.id_usuario);
    if (!usuario?.activo) {
        throw createHttpError("Sesión inválida o vencida", 401);
    }
    const permisos = await rolPermisoModel.findByRol(usuario.id_rol);
    return { usuario, permisos: permisos.map((permiso) => permiso.codigo), fecha_expiracion: sesion.fecha_expiracion };
};

const logout = async (token) => {
    if (token) {
        await sesionModel.revocar(digest(token));
    }
    return { message: "Sesión cerrada" };
};

const cambiarPassword = async (token, data, ip) => {
    const datosValidados = validateCambioPassword(data);
    const contexto = await autenticar(token);
    await limitarIntentos(ip, String(contexto.usuario.id_usuario), "password");
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const usuario = await authModel.findUsuarioForUpdate(client, contexto.usuario.id_usuario);
        const sesion = await sesionModel.findVigente(digest(token), client);
        if (!usuario?.activo || !sesion) {
            throw createHttpError("Sesión inválida o vencida", 401);
        }
        if (!(await verifyPassword(datosValidados.actual, usuario.password_hash))) {
            throw Object.assign(createHttpError("Contraseña actual incorrecta", 400), {
                field: 'password_actual', publicCode: 'INVALID_CURRENT_PASSWORD'
            });
        }
        await authModel.updatePassword(client, usuario.id_usuario, await hashPassword(datosValidados.nueva));
        await sesionModel.revocarByUsuario(client, usuario.id_usuario);
        await client.query("COMMIT");
        return { message: "Contraseña actualizada. Inicie sesión nuevamente" };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

// Solo para el comando local de instalación; no se expone mediante HTTP.
const crearPrimerJefe = async (data) => {
    const datosValidados = validatePrimerJefe(data);
    const passwordHash = await hashPassword(datosValidados.password);
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await authModel.lockInstalacion(client);
        if (await authModel.hasUsuarios(client)) {
            throw createHttpError("La instalación ya tiene usuarios; no se puede crear otro primer jefe", 409);
        }
        const creado = await authModel.createPrimerJefe(client, {
            nombre_usuario: datosValidados.nombre_usuario, nombre: datosValidados.nombre, password_hash: passwordHash
        });
        if (!creado) {
            throw createHttpError("Falta el rol JEFE; aplique primero la migración 014", 409);
        }
        const usuario = await usuarioModel.findById(creado.id_usuario, client);
        await client.query("COMMIT");
        return usuario;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    login,
    autenticar,
    logout,
    cambiarPassword,
    crearPrimerJefe
};
