const { test } = require("node:test");
const assert = require("node:assert/strict");

const cases = [
    ["categoria_producto", "categorias_producto", "CategoriaProducto", { nombre: " Categoría ", descripcion: " Detalle " }],
    ["producto_transportado", "productos_transportados", "ProductoTransportado", { nombre: " Diésel ", unidad_medida: " galón " }],
    ["proveedor", "proveedores", "Proveedor", { nombre: " Proveedor ", ruc: " 123 ", telefono: " 099 " }],
    ["gasolinera", "gasolineras", "Gasolinera", { nombre: " Gasolinera ", ruc: " 123 ", agente_retencion: false }],
    ["chofer", "choferes", "Chofer", { nombre: " Chofer ", cedula: " 123 ", tipo_remuneracion: " Mensual " }],
    ["terminal", "terminales", "Terminal", { nombre: " Terminal ", ubicacion: " Ubicación " }],
    ["vehiculo", "vehiculos", "Vehiculo", { placa: " abc ", marca: " Marca ", modelo: " Modelo ", anio: "2026", capacidad_galones: "100" }],
    ["tarifa", "tarifas", "Tarifa", { id_gasolinera: "1", id_terminal: "1", valor_por_galon: "0.035", fecha_inicio: "2026-01-01" }]
];

for (const [entity, serviceName, suffix, data] of cases) {
    test(`${entity}: normalización en creación y actualización`, async () => {
        const { validateData } = require(`../src/utils/validators/${entity}.validators`);
        const model = require(`../src/models/${entity}.model`);
        const service = require(`../src/services/${serviceName}.service`);
        const original = { ...model };

        for (const invalid of [null, undefined, [], "texto"]) {
            assert.throws(() => validateData(invalid), { status: 400 });
        }
        for (const estado of [null, "true", "ACTIVO", 1]) {
            assert.throws(() => validateData({ ...data, estado }), { status: 400 });
        }

        try {
            model.findById = async () => ({ id: 1 });
            model.create = async (value) => value;
            model.update = async (id, value) => {
                assert.equal(id, 1);
                return value;
            };

            for (const [input, expected] of [[undefined, "ACTIVO"], [true, "ACTIVO"], [false, "INACTIVO"]]) {
                const payload = { ...data, estado: input };
                const created = await service[`create${suffix}`](payload);
                const updated = await service[`update${suffix}`]("1", payload);
                assert.equal(created.estado, expected);
                assert.deepEqual(updated, created);
                if (data.nombre) assert.equal(created.nombre, data.nombre.trim());
                if (entity === "gasolinera") assert.equal(created.agente_retencion, false);
            }
        } finally {
            Object.assign(model, original);
        }
    });
}

test("campos opcionales: texto limpio o null, sin coerciones", () => {
    const { validateData } = require("../src/utils/validators/proveedor.validators");
    const data = { nombre: " Prueba ", ruc: " 123 ", direccion: "   ", telefono: " 099 " };
    const result = validateData(data);
    assert.equal(result.direccion, null);
    assert.equal(result.correo, null);
    assert.equal(result.telefono, "099");
    assert.throws(() => validateData({ ...data, telefono: 99 }), { status: 400 });
});

test("IDs y valores numéricos no aceptan booleanos", () => {
    const { validateId } = require("../src/utils/validators/common.validators");
    assert.equal(validateId("1"), 1);
    for (const id of [true, false, null, [], 0, 1.5, 2147483648]) {
        assert.throws(() => validateId(id), { status: 400 });
    }
    const { validateData } = require("../src/utils/validators/vehiculo.validators");
    const data = cases.find(([entity]) => entity === "vehiculo")[3];
    assert.throws(() => validateData({ ...data, anio: true }), { status: 400 });
    assert.throws(() => validateData({ ...data, capacidad_galones: true }), { status: 400 });
});
