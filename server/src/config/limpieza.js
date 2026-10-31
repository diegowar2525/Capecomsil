const getLimpiezaConfig = () => {
    const habilitada = process.env.FOTOS_LIMPIEZA_AUTOMATICA ?? "true";
    const horas = Number(process.env.FOTOS_LIMPIEZA_HORAS ?? 24);
    if (!["true", "false"].includes(habilitada) || !Number.isInteger(horas) || horas < 1 || horas > 168) {
        throw new Error("Configure FOTOS_LIMPIEZA_AUTOMATICA como true/false y FOTOS_LIMPIEZA_HORAS entre 1 y 168");
    }
    return { habilitada: habilitada === "true", intervaloMs: horas * 60 * 60 * 1000 };
};

module.exports = { getLimpiezaConfig };
