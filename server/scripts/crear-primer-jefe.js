const readline = require("node:readline/promises");
const { Writable } = require("node:stream");
const authService = require("../src/services/auth.service");
const pool = require("../src/config/database");

const main = async () => {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        throw new Error("Ejecute este comando en una terminal interactiva; no acepta credenciales por argumentos");
    }
    let ocultar = false;
    const output = new Writable({
        write(chunk, encoding, callback) {
            if (!ocultar) {
                process.stdout.write(chunk, encoding);
            }
            callback();
        }
    });
    const rl = readline.createInterface({ input: process.stdin, output, terminal: true });
    try {
        const nombre_usuario = await rl.question("Nombre de usuario: ");
        const nombre = await rl.question("Nombre personal: ");
        process.stdout.write("Contraseña (10 a 128 caracteres, entrada oculta): ");
        ocultar = true;
        const password = await rl.question("");
        process.stdout.write("\nRepita la contraseña: ");
        const confirmacion = await rl.question("");
        ocultar = false;
        process.stdout.write("\n");
        if (password !== confirmacion) {
            throw new Error("Las contraseñas no coinciden");
        }
        const resultado = await authService.crearPrimerJefe({ nombre_usuario, nombre, password });
        process.stdout.write(`Jefe creado: ${resultado.nombre_usuario}\n`);
    } finally {
        rl.close();
    }
};

main().catch((error) => {
    // No imprimir objetos de PostgreSQL ni datos de credenciales.
    console.error(error.status || !error.code ? error.message : "No se pudo completar la instalación; revise conexión y migraciones");
    process.exitCode = 1;
}).finally(async () => {
    await pool.end();
});
