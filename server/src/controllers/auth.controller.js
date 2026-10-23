const usuariosService = require("../services/usuarios.service");
const authService = require("../services/auth.service");
const config = require("../config/auth");
const { readToken } = require("../utils/session-cookie");

const login = async (req, res, next) => {
    try {
        const resultado = await authService.login(req.body, req.ip, readToken(req));
        res.cookie(config.cookieName, resultado.token, {
            ...config.cookieOptions, expires: new Date(resultado.fecha_expiracion)
        });
        return res.status(200).json({ usuario: resultado.usuario, fecha_expiracion: resultado.fecha_expiracion });
    } catch (error) {
        next(error);
    }
};

const me = async (req, res, next) => {
    try {
        const resultado = req.auth;
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        const resultado = await authService.logout(readToken(req));
        res.clearCookie(config.cookieName, config.cookieOptions);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const cambiarPassword = async (req, res, next) => {
    try {
        const resultado = await authService.cambiarPassword(readToken(req), req.body, req.ip);
        res.clearCookie(config.cookieName, config.cookieOptions);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

const updatePerfil = async (req, res, next) => {
    try {
        const resultado = await usuariosService.updatePerfil(req.auth.usuario.id_usuario, req.body);
        return res.status(200).json(resultado);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    updatePerfil,
    login,
    me,
    logout,
    cambiarPassword
};
