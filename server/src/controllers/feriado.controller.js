const service = require("../services/feriado.service");

const findAll = async (req, res, next) => {
    try {
        const result = await service.findAll();
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const findById = async (req, res, next) => {
    try {
        const result = await service.findById(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const result = await service.create(req.body);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const result = await service.update(req.params.id, req.body);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        const result = await service.remove(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = { 
    findAll, 
    findById, 
    create, 
    update, 
    remove 
};
