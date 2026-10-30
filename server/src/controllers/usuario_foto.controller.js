const service = require("../services/usuario_foto.service");

const guardar = async (req, res, next) => {
    try {
        const usuario = await service.guardar(req.auth.usuario.id_usuario, req.file);
        res.json(usuario);
    } catch (error) {
        next(error);
    }
};

const eliminar = async (req, res, next) => {
    try {
        const usuario = await service.eliminar(req.auth.usuario.id_usuario);
        res.json(usuario);
    } catch (error) {
        next(error);
    }
};

const consultar = async (req, res, next) => {
    try {
        const buffer = await service.consultar(req.params.id);
        res.set("Cache-Control", "private, no-store");
        res.set("X-Content-Type-Options", "nosniff");
        res.type("image/webp").send(buffer);
    } catch (error) {
        next(error);
    }
};

module.exports = { guardar, eliminar, consultar };
