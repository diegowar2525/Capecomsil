const archivoService = require("../services/archivo.service");
const almacenamiento = require("../config/almacenamiento");
const limpieza = require("../config/limpieza");

const iniciarLimpiezaFotos = () => {
    let config;
    try {
        config = limpieza.getLimpiezaConfig();
        if (!config.habilitada) {
            return () => {};
        }
        almacenamiento.getConfig();
    } catch {
        console.warn("Limpieza automática de fotos deshabilitada: revise la configuración de R2 y FOTOS_LIMPIEZA_HORAS/AUTOMATICA");
        return () => {};
    }

    let detenido = false;
    let timer;
    const programar = (espera) => {
        timer = setTimeout(ejecutar, espera);
        timer.unref?.();
    };
    const ejecutar = async () => {
        try {
            const total = await archivoService.limpiarPendientes();
            if (total > 0) {
                console.log(`Limpieza automática de fotos: ${total} archivos eliminados`);
            }
        } catch (error) {
            // Sin cuerpos ni credenciales: la cola conserva los archivos pendientes.
            console.error("Falló la limpieza automática de fotos; se reintentará en el próximo ciclo", {
                name: error.name, code: error.code, status: error.status
            });
        } finally {
            // Programar después de terminar impide superponer ciclos lentos.
            if (!detenido) {
                programar(config.intervaloMs);
            }
        }
    };

    // Recupera pendientes al reiniciar, sin retrasar el arranque de la API.
    programar(60000);
    console.log(`Limpieza automática de fotos habilitada cada ${config.intervaloMs / 3600000} horas`);
    return () => {
        detenido = true;
        clearTimeout(timer);
    };
};

module.exports = { iniciarLimpiezaFotos };
