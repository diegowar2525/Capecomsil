const { randomUUID } = require("node:crypto");
const pool = require("../config/database");
const { getConfig } = require("../config/almacenamiento");
const fotoModel = require("../models/catalogo_foto.model");
const archivosModel = require("../models/archivo.model");
const almacenamiento = require("./almacenamiento.service");
const { prepararFoto } = require("./imagen.service");
const { validateId } = require("../utils/validators/common.validators");
const { validateRecurso } = require("../utils/validators/catalogo_foto.validators");
const { createHttpError } = require("../utils/errors/http.error");

const actualizar = async (recurso, id, foto) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query("SET LOCAL lock_timeout = '5s'");
        if (!await fotoModel.lockRegistro(client, recurso, id)) {
            throw createHttpError("Registro no encontrado", 404);
        }
        const resultado = await fotoModel.updateImagen(client, recurso, id, foto?.url ?? null);
        if (foto) {
            await fotoModel.create(client, recurso, id, foto);
            await archivosModel.cancelarBorrado(client, foto.clave);
        }
        await client.query("COMMIT");
        return resultado;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const guardar = async (tipo, idRegistro, file) => {
    const recurso = validateRecurso(tipo);
    const id = validateId(idRegistro);
    const config = getConfig();
    // Conservar el encuadre completo de vehículos y productos; no recortar como avatar.
    const buffer = await prepararFoto(file, { lado: 1024, ajuste: "inside" });
    const version = randomUUID();
    const clave = `catalogos/${recurso}/${id}/${version}.webp`;
    await archivosModel.programarBorrado(clave);
    await almacenamiento.guardar(clave, buffer);
    return await actualizar(recurso, id, {
        clave, url: `${config.apiUrl}/api/fotos/${recurso}/${id}?v=${version}`
    });
};

const eliminar = async (tipo, idRegistro) => {
    return await actualizar(validateRecurso(tipo), validateId(idRegistro), null);
};

const consultar = async (tipo, idRegistro) => {
    const foto = await fotoModel.findByRegistro(validateRecurso(tipo), validateId(idRegistro));
    if (!foto) {
        throw createHttpError("Foto no encontrada", 404);
    }
    return await almacenamiento.obtener(foto.clave);
};

module.exports = { guardar, eliminar, consultar };
