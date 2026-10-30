const service = require("../services/catalogo_foto.service");

const guardar = async (req, res, next) => {
    try {
        res.json(await service.guardar(req.params.recurso, req.params.id, req.file));
    } catch (error) {
        next(error);
    }
};

const eliminar = async (req, res, next) => {
    try {
        res.json(await service.eliminar(req.params.recurso, req.params.id));
    } catch (error) {
        next(error);
    }
};

const consultar = async (req, res, next) => {
    try {
        const buffer = await service.consultar(req.params.recurso, req.params.id);
        res.set("Cache-Control", "private, no-store");
        res.set("X-Content-Type-Options", "nosniff");
        res.type("image/webp").send(buffer);
    } catch (error) {
        next(error);
    }
};

module.exports = { guardar, eliminar, consultar };
