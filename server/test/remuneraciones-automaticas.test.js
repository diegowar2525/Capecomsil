const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {Pool}=require('pg');
const pool=require('../src/config/database');
const service=require('../src/services/remuneraciones.service');
const {validateData}=require('../src/utils/validators/chofer.validators');

test('Fechas laborales: formato, período y fin opcional',()=>{
 const data={nombre:'Chofer',cedula:'1',tipo_remuneracion:'DIARIO_FIJO',fecha_inicio_trabajo:'2020-01-03'};
 assert.equal(validateData(data).fecha_fin_trabajo,null);
 for(const fecha_fin_trabajo of ['2020-01-02','2020-02-30'])assert.throws(()=>validateData({...data,fecha_fin_trabajo}),{status:400});
});

test('Automática: días sin viajes, reinicio, concurrencia, fechas laborales y cobertura',async t=>{
 const admin=await pool.connect(),schema='auto_remuneraciones_'+process.pid;
 const isolated=new Pool({...pool.options,password:pool.options.password,options:'-c search_path='+schema+',public'});
 try{
  await admin.query('BEGIN');await admin.query(`CREATE SCHEMA ${schema}`);await admin.query(`SET LOCAL search_path TO ${schema},public`);
  await admin.query(fs.readFileSync(path.join(__dirname,'../../database/schema.sql'),'utf8'));
  await admin.query("INSERT INTO configuracion_remuneracion(importe_diario,adicional_dia_especial,fecha_inicio) VALUES (30,10,'2020-01-01'); INSERT INTO chofer(nombre,cedula,tipo_remuneracion,fecha_inicio_trabajo,fecha_fin_trabajo) VALUES ('Fijo','1','DIARIO_FIJO','2020-01-03','2020-01-07'),('Trabajado','2','DIA_TRABAJADO','2020-01-03','2020-01-07'),('Sin configuración','3','DIARIO_FIJO','2019-12-31','2019-12-31'); INSERT INTO chofer(nombre,cedula,tipo_remuneracion) VALUES ('Anterior','4','DIARIO_FIJO'); INSERT INTO chofer(nombre,cedula,tipo_remuneracion,fecha_inicio_trabajo) VALUES ('Nuevo','5','DIARIO_FIJO',(CURRENT_TIMESTAMP AT TIME ZONE 'America/Guayaquil')::date)");
  await admin.query('COMMIT');t.mock.method(pool,'query',isolated.query.bind(isolated));t.mock.method(pool,'connect',isolated.connect.bind(isolated));
  const results=await Promise.all([service.completarPendientes(),service.completarPendientes()]);
  assert.equal(results.reduce((n,r)=>n+r.generadas,0),10);assert.ok(results.every(r=>r.fallos.length===0));
  const fixed=(await isolated.query('SELECT fecha::text,total::text FROM remuneracion_chofer WHERE id_chofer=1 ORDER BY fecha')).rows;
  assert.deepEqual(fixed.map(r=>r.total),['30.00','30.00','0.00','30.00','30.00']);
  assert.equal((await isolated.query('SELECT SUM(total)::text total FROM remuneracion_chofer WHERE id_chofer=2')).rows[0].total,'0.00');
  assert.equal((await service.completarPendientes()).generadas,0);
  const query={id_chofer:3,fecha_desde:'2019-12-31',fecha_hasta:'2019-12-31'};
  assert.equal((await service.cobertura(query)).dias_pendientes,1);
  await isolated.query("INSERT INTO configuracion_remuneracion(importe_diario,adicional_dia_especial,fecha_inicio,fecha_fin) VALUES (20,10,'2019-12-31','2019-12-31')");
  assert.equal((await service.completarPendientes()).generadas,1);assert.equal((await service.cobertura(query)).dias_pendientes,0);
  assert.equal((await service.cobertura({...query,id_chofer:4})).fecha_inicio_trabajo,null);
  await isolated.query("UPDATE chofer SET fecha_fin_trabajo='2020-01-04' WHERE id_chofer=1");
  assert.equal((await isolated.query('SELECT SUM(total)::text total FROM remuneracion_chofer WHERE id_chofer=1')).rows[0].total,'60.00');
  await isolated.query("UPDATE chofer SET fecha_fin_trabajo='2020-01-08' WHERE id_chofer=1");
  assert.equal((await service.completarPendientes()).generadas,1);
  assert.equal((await isolated.query('SELECT SUM(total)::text total FROM remuneracion_chofer WHERE id_chofer=1')).rows[0].total,'150.00');
  assert.equal((await isolated.query('SELECT COUNT(*)::integer n FROM remuneracion_chofer WHERE id_chofer=5')).rows[0].n,0);
 }finally{await isolated.end();await admin.query('ROLLBACK');await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);admin.release();await pool.end();}
});
