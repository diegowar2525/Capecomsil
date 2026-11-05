const { completarPendientes } = require('../services/remuneraciones.service');

const iniciarRemuneracionesAutomaticas = () => {
    let detenido = false;
    let timer;
    const ejecutar = async () => {
        let espera = 3600000;
        try {
            const { generadas, fallos } = await completarPendientes();
            if (generadas) console.log(`Remuneraciones automáticas: ${generadas} días completados`);
            if (fallos.length) console.error('Remuneraciones pendientes; se reintentará', fallos);
            if (generadas >= 366) espera = 60000;
        } catch (error) {
            console.error('Falló la generación automática de remuneraciones; se reintentará', { name: error.name, code: error.code });
        } finally {
            if (!detenido) { timer = setTimeout(ejecutar, espera); timer.unref?.(); }
        }
    };
    timer = setTimeout(ejecutar, 1000);
    timer.unref?.();
    return () => { detenido = true; clearTimeout(timer); };
};
module.exports = { iniciarRemuneracionesAutomaticas };
