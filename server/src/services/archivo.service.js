const pool = require("../config/database");
const { getConfig } = require("../config/almacenamiento");
const archivoModel = require("../models/archivo.model");
const almacenamiento = require("./almacenamiento.service");

const limpiarPendientes = async (limite = 100) => {
    getConfig();
    let eliminados = 0;
    for (let i = 0; i < limite; i++) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const pendiente = await archivoModel.lockBorradoPendiente(client);
            if (!pendiente) {
                await client.query("COMMIT");
                break;
            }
            await almacenamiento.eliminar(pendiente.clave);
            await archivoModel.cancelarBorrado(client, pendiente.clave);
            await client.query("COMMIT");
            eliminados++;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }
    return eliminados;
};

module.exports = { limpiarPendientes };
