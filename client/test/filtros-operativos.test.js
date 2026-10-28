import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { filtrarOrdenarCatalogo, opcionesFiltro } from '../src/domain/catalogoFiltros.js';
import { rangoFechas, seleccion } from '../src/domain/filtrosOperativos.js';

test('Los rangos de fechas incluyen el día completo y descartan fechas ausentes', () => {
    const data = [{id:1,fecha:'2026-10-02T23:59:59'}, {id:2,fecha:'2026-10-03T00:00:00'}, {id:3,fecha:null}];
    const result = filtrarOrdenarCatalogo(data, {columns:[], rowKey:'id', filters:rangoFechas('fecha'), values:{fecha_desde:'2026-10-02',fecha_hasta:'2026-10-02'}});
    assert.deepEqual(result.map(row => row.id), [1]);
});

test('Los selectores muestran placas pero filtran por la identidad del vehículo', () => {
    const filter = seleccion('id_vehiculo','Vehículo','placa');
    const data = [{id:1,id_vehiculo:7,placa:'ABC-123'}, {id:2,id_vehiculo:8,placa:'XYZ-999'}];
    assert.deepEqual(opcionesFiltro(filter,data), [{value:'7',label:'ABC-123'},{value:'8',label:'XYZ-999'}]);
    assert.deepEqual(filtrarOrdenarCatalogo(data,{columns:[],rowKey:'id',filters:[filter],values:{id_vehiculo:'8'}}).map(row=>row.id),[2]);
});

test('Todos los listados tienen filtros sin nombres duplicados; informes usa consultas propias', async () => {
    for (const dir of await readdir(new URL('../src/modules/',import.meta.url),{withFileTypes:true})) {
        if (!dir.isDirectory()) continue;
        const files = await readdir(new URL(`../src/modules/${dir.name}/`,import.meta.url));
        for (const file of files.filter(name=>name.endsWith('.filters.js'))) {
            const {filters} = await import(`../src/modules/${dir.name}/${file}`);
            if (dir.name !== 'informes') assert.ok(filters.length, dir.name);
            assert.equal(new Set(filters.map(filter=>filter.name)).size,filters.length,dir.name);
            for (const filter of filters) {
                if (/^id_/.test(filter.name) && filter.name !== 'id_viaje') assert.ok(filter.labelKey || filter.options, `${dir.name}: ${filter.name}`);
            }
        }
    }
});
