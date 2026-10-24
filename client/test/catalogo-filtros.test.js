import test from 'node:test';
import assert from 'node:assert/strict';
import { filtrarOrdenarCatalogo, opcionesFiltro, filtroEstado } from '../src/domain/catalogoFiltros.js';

const data = [
    { id: 2, nombre: 'Diésel', estado: false, marca: 'B' },
    { id: 10, nombre: 'Diesel nuevo', estado: true, marca: 'A' },
    { id: 1, nombre: 'Gasolina', estado: true, marca: 'A' }
];
const config = { columns: [{ key: 'nombre' }], rowKey: 'id', filters: [filtroEstado, { name: 'marca' }] };

test('Catálogos: ID numérico ascendente por defecto, descendente opcional sin mutar los datos', () => {
    assert.deepEqual(filtrarOrdenarCatalogo(data, config).map((row) => row.id), [1, 2, 10]);
    assert.deepEqual(filtrarOrdenarCatalogo(data, { ...config, order: 'desc' }).map((row) => row.id), [10, 2, 1]);
    assert.deepEqual(data.map((row) => row.id), [2, 10, 1]);
});

test('Filtros: combinación exacta de estado y marca, búsqueda sin acentos y conjunto vacío', () => {
    assert.deepEqual(filtrarOrdenarCatalogo(data, { ...config, values: { estado: 'false' }, search: 'DIESEL' }).map((row) => row.id), [2]);
    assert.deepEqual(filtrarOrdenarCatalogo(data, { ...config, values: { estado: 'true', marca: 'A' } }).map((row) => row.id), [1, 10]);
    assert.deepEqual(filtrarOrdenarCatalogo(data, { ...config, values: { estado: 'false', marca: 'A' } }), []);
    assert.equal(filtrarOrdenarCatalogo(data, { ...config, values: { estado: '', marca: '' } }).length, 3);
});

test('Filtros: opciones del listado completo, únicas, ordenadas y sin valores nulos', () => {
    assert.deepEqual(opcionesFiltro({ name: 'marca' }, [...data, { marca: null }]), [
        { value: 'A', label: 'A' }, { value: 'B', label: 'B' }
    ]);
    assert.equal(opcionesFiltro(filtroEstado, []).length, 2);
    assert.equal(filtrarOrdenarCatalogo(data, { ...config, filters: [{ name: 'nombre', type: 'text' }], values: { nombre: 'dies' } }).length, 2);
});

test('Todos los catálogos conectados declaran filtros de estado reutilizados', async () => {
    for (const slug of ['vehiculos', 'choferes', 'gasolineras', 'terminales', 'productos', 'proveedores', 'trayectos', 'categorias-producto', 'productos-inventario']) {
        const { filters } = await import(`../src/modules/${slug}/${slug}.filters.js`);
        assert.equal(filters[0], filtroEstado);
        assert.equal(new Set(filters.map((filter) => filter.name)).size, filters.length);
    }
});
