const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getConfig } = require("../config/almacenamiento");
const { createHttpError } = require("../utils/errors/http.error");

const ejecutar = async (Command, data) => {
    const config = getConfig();
    const client = new S3Client({
        region: "auto", endpoint: config.endpoint, maxAttempts: 2,
        credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey }
    });
    try {
        return await client.send(new Command({ Bucket: config.bucket, ...data }), {
            abortSignal: AbortSignal.timeout(30000)
        });
    } catch (error) {
        if (error.name === "NoSuchKey") {
            throw createHttpError("Foto no encontrada", 404);
        }
        throw createHttpError("No se pudo acceder al almacenamiento de fotos. Inténtelo nuevamente", 503);
    } finally {
        client.destroy();
    }
};

const guardar = async (clave, buffer) => {
    await ejecutar(PutObjectCommand, { Key: clave, Body: buffer, ContentType: "image/webp" });
};

const obtener = async (clave) => {
    // Consumir el cuerpo antes de destruir el cliente de S3.
    const config = getConfig();
    const client = new S3Client({ region: "auto", endpoint: config.endpoint, maxAttempts: 2,
        credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } });
    try {
        const result = await client.send(new GetObjectCommand({ Bucket: config.bucket, Key: clave }), {
            abortSignal: AbortSignal.timeout(30000)
        });
        return Buffer.from(await result.Body.transformToByteArray());
    } catch (error) {
        throw createHttpError(error.name === "NoSuchKey" ? "Foto no encontrada" : "No se pudo consultar la foto", error.name === "NoSuchKey" ? 404 : 503);
    } finally {
        client.destroy();
    }
};

const eliminar = async (clave) => {
    await ejecutar(DeleteObjectCommand, { Key: clave });
};

module.exports = { guardar, obtener, eliminar };
