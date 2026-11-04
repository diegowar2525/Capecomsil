const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const provincia = require('../src/models/provincia.model');
const ciudad = require('../src/models/ciudad.model');
const gasolinera = require('../src/models/gasolinera.model');
const terminal = require('../src/models/terminal.model');
const validarProvincia = require('../src/utils/validators/provincia.validators').validateData;
const validarCiudad = require('../src/utils/validators/ciudad.validators').validateData;
const validarGasolinera = require('../src/utils/validators/gasolinera.validators').validateData;
const validarTerminal = require('../src/utils/validators/terminal.validators').validateData;

test('Geografía: validaciones y referencias opcionales', () => {
    assert.equal(validarProvincia({nombre:' Azuay '}).nombre, 'Azuay');
    for (const nombre of ['', ' ', 'x'.repeat(101), 42]) assert.throws(() => validarProvincia({nombre}), {status:400});
    for (const id_provincia of [null, 0, -1, 'abc']) assert.throws(() => validarCiudad({nombre:'Cuenca', id_provincia}), {status:400});
    assert.equal(validarCiudad({nombre:'Cuenca',id_provincia:'1'}).id_provincia, 1);
    assert.equal(validarGasolinera({nombre:'Estación',ruc:'123'}).id_ciudad,null);
    assert.equal(validarTerminal({nombre:'Terminal',ubicacion:'Dirección'}).id_ciudad,null);
    assert.throws(() => validarGasolinera({nombre:'Estación',ruc:'123',id_ciudad:'abc'}),{status:400});
});

test('Geografía: migración conserva datos y relaciones protegen el historial', async () => {
    const pool = require('../src/config/database');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('CREATE SCHEMA geografia_test_' + process.pid);
        await client.query('SET LOCAL search_path TO geografia_test_' + process.pid + ',public');
        await client.query(fs.readFileSync(path.join(__dirname,'../../database/schema.sql'),'utf8').split('-- Provincias y ciudades (031).')[0]);
        await client.query("INSERT INTO terminal(nombre,ubicacion) VALUES ('Anterior','Dirección anterior')");
        await client.query(fs.readFileSync(path.join(__dirname,'../../database/migrations/031_provincias_ciudades.sql'),'utf8').replace(/^BEGIN;\s*/, '').replace(/COMMIT;\s*$/, ''));
        assert.equal((await terminal.findAll(client))[0].id_ciudad, null);
        const a = await provincia.create(validarProvincia({nombre:'Azuay'}),client);
        const b = await provincia.create(validarProvincia({nombre:'Loja'}),client);
        const c = await ciudad.create(validarCiudad({nombre:'Cuenca',id_provincia:a.id_provincia}),client);
        const other = await ciudad.create(validarCiudad({nombre:'Cuenca',id_provincia:b.id_provincia}),client);
        assert.equal((await ciudad.findById(c.id_ciudad,client)).provincia,'Azuay');
        const g = await gasolinera.create(validarGasolinera({nombre:'Estación',ruc:'123',id_ciudad:c.id_ciudad}),client);
        const t = await terminal.create(validarTerminal({nombre:'Nueva',ubicacion:'Dirección',id_ciudad:c.id_ciudad}),client);
        assert.equal((await gasolinera.findById(g.id_gasolinera,client)).provincia,'Azuay');
        assert.equal((await terminal.findById(t.id_terminal,client)).ciudad,'Cuenca');
        const rejects = async (fn, code) => {
            await client.query('SAVEPOINT invalid');
            await assert.rejects(fn, error => code.includes(error.code));
            await client.query('ROLLBACK TO SAVEPOINT invalid');
        };
        await rejects(() => provincia.create({nombre:' azuay ',estado:true},client),['23505']);
        await rejects(() => ciudad.create({nombre:' CUENCA ',id_provincia:a.id_provincia,estado:true},client),['23505']);
        await rejects(() => provincia.remove(a.id_provincia,client),['23001','23503']);
        await rejects(() => ciudad.remove(c.id_ciudad,client),['23001','23503']);
        await rejects(() => ciudad.create({nombre:'Inválida',id_provincia:2147483647,estado:true},client),['23503']);
        await gasolinera.update(g.id_gasolinera,validarGasolinera({...g,id_ciudad:other.id_ciudad}),client);
        assert.equal((await gasolinera.findById(g.id_gasolinera,client)).provincia,'Loja');
        await terminal.update(t.id_terminal,validarTerminal({...t,id_ciudad:null}),client);
        assert.equal((await terminal.findById(t.id_terminal,client)).ciudad,null);
        await ciudad.update(c.id_ciudad,{nombre:'Cuenca centro',id_provincia:a.id_provincia,estado:false},client);
        assert.equal((await ciudad.findById(c.id_ciudad,client)).estado,false);
        await ciudad.remove(c.id_ciudad,client);
        await provincia.remove(a.id_provincia,client);
    } finally {
        await client.query('ROLLBACK');
        client.release();
        await pool.end();
    }
});
