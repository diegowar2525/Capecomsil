const pool = require("../src/config/database");
const { limpiarPendientes } = require("../src/services/archivo.service");

limpiarPendientes().then(total => {
    console.log(`Archivos eliminados: ${total}`);
}).catch(error => {
    console.error("Falló la limpieza de fotos", { name: error.name, status: error.status });
    process.exitCode = 1;
}).finally(() => pool.end());
