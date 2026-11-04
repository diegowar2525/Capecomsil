const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const marca = require('../src/models/marca.model');
const modelo = require('../src/models/modelo.model');
const vehiculo = require('../src/models/vehiculo.model');
const producto = require('../src/models/producto.model');
const validar = require('../src/utils/validators/marca.validators').validateData;

test('Marcas: nombre normalizado, ámbito y estado válidos',()=>{
 assert.equal(validar({nombre:' Hino   Motors ',ambito:'VEHICULO'}).nombre,'Hino Motors');
 for(const input of [{nombre:' ',ambito:'VEHICULO'},{nombre:'Hino',ambito:'OTRO'},{nombre:'Hino',ambito:'VEHICULO',estado:'true'}]) assert.throws(()=>validar(input),{status:400});
});
test('Marcas y modelos: migración sin pérdidas, ámbitos, referencias y desactivación',async()=>{
 const pool=require('../src/config/database'); const client=await pool.connect();
 try {
  await client.query('BEGIN');await client.query('CREATE SCHEMA marcas_test_'+process.pid);await client.query('SET LOCAL search_path TO marcas_test_'+process.pid+',public');
  await client.query(fs.readFileSync(path.join(__dirname,'../../database/schema.sql'),'utf8').split('-- Marcas y modelos normalizados (032).')[0]);
  await client.query("INSERT INTO vehiculo(placa,marca,modelo,capacidad_galones) VALUES ('A','Hino','700',4000),('B',' HINO ',' 700 ',6000); INSERT INTO categoria_producto(nombre) VALUES ('Repuestos'); INSERT INTO producto(id_categoria,nombre,unidad_medida,modelo) VALUES (1,'Anterior','unidad','Sin marca conocida')");
  await client.query(fs.readFileSync(path.join(__dirname,'../../database/migrations/032_marcas_modelos.sql'),'utf8').replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,''));
  const brands=await marca.findAll('VEHICULO',client);assert.equal(brands.length,1);
  const models=await modelo.findAll('VEHICULO',client);assert.equal(models.length,1);
  const v=await vehiculo.findById(1,client);assert.equal(v.id_marca,brands[0].id_marca);assert.equal(v.id_modelo,models[0].id_modelo);
  assert.equal((await producto.findById(1,client)).modelo,'Sin marca conocida');
  const rejects=async(fn,codes)=>{await client.query('SAVEPOINT bad');await assert.rejects(fn,e=>codes.includes(e.code));await client.query('ROLLBACK TO SAVEPOINT bad');};
  await rejects(()=>marca.create({ambito:'VEHICULO',nombre:' hino ',estado:true},client),['23505']);
  const other=await marca.create({ambito:'PRODUCTO',nombre:'Hino',estado:true},client);
  await rejects(()=>client.query('UPDATE vehiculo SET id_marca=$1,id_modelo=NULL WHERE id_vehiculo=1',[other.id_marca]),['23514']);
  const second=await marca.create({ambito:'VEHICULO',nombre:'Otro',estado:true},client);
  const secondModel=await modelo.create({id_marca:second.id_marca,nombre:'700',estado:true},client);
  await rejects(()=>client.query('UPDATE vehiculo SET id_modelo=$1 WHERE id_vehiculo=1',[secondModel.id_modelo]),['23514']);
  await rejects(()=>modelo.remove(v.id_modelo,client),['23503','23001']);
  await rejects(()=>marca.remove(v.id_marca,client),['23503','23001']);
  await marca.update(v.id_marca,{nombre:'Hino Motors',estado:false},client);
  await client.query("UPDATE vehiculo SET placa='EDITADO' WHERE id_vehiculo=1");
  assert.equal((await vehiculo.findById(1,client)).marca,'Hino Motors');
  await rejects(()=>client.query("INSERT INTO vehiculo(placa,capacidad_galones,id_marca,id_modelo) VALUES ('C',4000,$1,$2)",[v.id_marca,v.id_modelo]),['23514']);
  await modelo.remove(secondModel.id_modelo,client);await marca.remove(second.id_marca,client);
 } finally {await client.query('ROLLBACK');client.release();await pool.end();}
});
