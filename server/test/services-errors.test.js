const { test } = require("node:test");
const assert = require("node:assert/strict");
const categoriaModel = require("../src/models/categoria_producto.model");
const categorias = require("../src/services/categorias_producto.service");
const choferModel = require("../src/models/chofer.model");
const choferes = require("../src/services/choferes.service");

test("Servicios: distinguen una referencia ausente, inactiva y un recurso inexistente", async (t) => {
    let categoria = null;
    t.mock.method(categoriaModel, "findById", async () => categoria);
    await assert.rejects(categorias.validateCategoriaActiva(1), {
        message: "La categoría indicada no existe",
        status: 400
    });
    await assert.rejects(categorias.getCategoriaProductoById(1), {
        message: "Categoría de producto no encontrada",
        status: 404
    });
    categoria = { estado: false };
    await assert.rejects(categorias.validateCategoriaActiva(1), {
        message: "La categoría seleccionada debe estar activa",
        status: 409
    });
    categoria = { estado: true };
    await categorias.validateCategoriaActiva(1);
});

test("Servicios: validan antes de consultar y propagan errores inesperados del modelo", async (t) => {
    const fallo = new Error("Fallo de conexión simulado");
    const consulta = t.mock.method(choferModel, "findById", async () => {
        throw fallo;
    });
    await assert.rejects(choferes.getChoferById("inválido"), { status: 400 });
    assert.equal(consulta.mock.callCount(), 0);
    await assert.rejects(choferes.getChoferById(1), (error) => error === fallo);
    assert.equal(consulta.mock.callCount(), 1);
});
