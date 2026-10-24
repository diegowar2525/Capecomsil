import test from 'node:test';
import assert from 'node:assert/strict';
import { filtrarOrdenarCatalogo, opcionesFiltro, filtroEstado, paginarCatalogo } from '../src/domain/catalogoFiltros.js';

const data = [
    { id: 2, nombre: 'Diésel', estado: false, marca: 'B' },
    { id: 10, nombre: 'Diesel nuevo', estado: true, marca: 'A' },
    { id: 1, nombre: 'Gasolina', estado: true, marca: 'A' }
];
const config = { columns: [{ key: 'nombre' }], rowKey: 'id', filters: [filtroEstado, { name: 'marca' }] };

test('Paginación: filtra y ordena antes de cortar, ajusta página al eliminar y admite vacío', () => {
    const rows = Array.from({ length: 53 }, (_, i) => ({ id: 53 - i, estado: i % 2 === 0 }));
    const filtered = filtrarOrdenarCatalogo(rows, { ...config, values: { estado: 'true' } });
    const page = paginarCatalogo(filtered, 2, 10);
    assert.equal(page.total, 27);
    assert.equal(page.totalPages, 3);
    assert.deepEqual(page.rows.map((row) => row.id), [21, 23, 25, 27, 29, 31, 33, 35, 37, 39]);
    assert.deepEqual([page.from, page.to], [11, 20]);
    const last = paginarCatalogo(rows.slice(0, 20), 6, 10);
    assert.equal(last.currentPage, 2);
    assert.equal(last.rows.length, 10);
    assert.equal(paginarCatalogo(rows, 1, 25).rows.length, 25);
    assert.equal(paginarCatalogo(rows, 2, 50).rows.length, 3);
    assert.equal(paginarCatalogo(rows, -2, 0).currentPage, 1);
    assert.deepEqual(paginarCatalogo([], 8, 10), { rows: [], currentPage: 1, totalPages: 1, pageSize: 10, from: 0, to: 0, total: 0 });
});

test('Filtros avanzados: límites inclusivos, cero, valores nulos y presencia de foto', () => {
    const rows = [{ id: 1, km: '0.00', imagen_url: null }, { id: 2, km: '10.50', imagen_url: 'https://example.com/a.jpg' }, { id: 3, km: null, imagen_url: '' }];
    const filters = [
        { name: 'min', field: 'km', operator: 'min' }, { name: 'max', field: 'km', operator: 'max' },
        { name: 'foto', field: 'imagen_url', operator: 'presence' }
    ];
    const run = (values) => filtrarOrdenarCatalogo(rows, { ...config, filters, values }).map((row) => row.id);
    assert.deepEqual(run({ min: '0', max: '10.50' }), [1, 2]);
    assert.deepEqual(run({ max: '0' }), [1]);
    assert.deepEqual(run({ min: '11', max: '10' }), []);
    assert.deepEqual(run({ foto: 'false' }), [1, 3]);
    assert.deepEqual(run({ foto: 'true' }), [2]);
});

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
