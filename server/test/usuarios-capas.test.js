const { test } = require("node:test");
const assert = require("node:assert/strict");
const { validateFiltros } = require("../src/utils/validators/usuario.validators");
const usuarioModel = require("../src/models/usuario.model");
const usuariosService = require("../src/services/usuarios.service");
const usuariosController = require("../src/controllers/usuarios.controller");
const rolesService = require("../src/services/roles.service");
const permisosService = require("../src/services/permisos.service");

test("Usuarios: filtros tipados, paginación y entradas inválidas", () => {
    assert.deepEqual(validateFiltros(), { activo: null, id_rol: null, limit: 50, offset: 0 });
    assert.deepEqual(validateFiltros({ activo: "false", id_rol: "2", limit: "10", offset: "3" }), {
        activo: false, id_rol: 2, limit: 10, offset: 3
    });
    for (const query of [null, [], { activo: false }, { id_rol: true }, { limit: "201" }, { offset: "-1" }, { offset: 1 }, { password_hash: "x" }]) {
        assert.throws(() => validateFiltros(query), { status: 400 });
    }
});

test("Usuarios: servicio valida y controlador delega respuesta o error", async (t) => {
    const usuario = { id_usuario: 7, nombre_usuario: "operador", rol: "OPERADOR" };
    const consulta = t.mock.method(usuarioModel, "findById", async (id) => {
        assert.equal(id, 7);
        return usuario;
    });
    await assert.rejects(usuariosService.findById(true), { status: 400 });
    assert.equal(consulta.mock.callCount(), 0);
    const res = {
        status(code) { assert.equal(code, 200); return this; },
        json(data) { assert.equal(data, usuario); return this; }
    };
    await usuariosController.findById({ params: { id: "7" } }, res, assert.fail);
    consulta.mock.restore();
    t.mock.method(usuarioModel, "findById", async () => null);
    const errors = [];
    await usuariosController.findById({ params: { id: "7" } }, res, (error) => errors.push(error));
    assert.equal(errors.length, 1);
    assert.equal(errors[0].status, 404);
});

test("Roles y permisos: recursos ausentes se traducen a 404", async (t) => {
    t.mock.method(require("../src/models/rol.model"), "findById", async () => null);
    t.mock.method(require("../src/models/permiso.model"), "findById", async () => null);
    await assert.rejects(rolesService.findPermisos(7), { status: 404 });
    await assert.rejects(permisosService.findById(7), { status: 404 });
});
