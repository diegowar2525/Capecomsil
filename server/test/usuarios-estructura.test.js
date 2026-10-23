const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const pool = require("../src/config/database");
const rolModel = require("../src/models/rol.model");
const permisoModel = require("../src/models/permiso.model");
const rolPermisoModel = require("../src/models/rol_permiso.model");
const usuarioModel = require("../src/models/usuario.model");
const sesionModel = require("../src/models/sesion.model");

const schema = fs.readFileSync(path.join(__dirname, "../../database/schema.sql"), "utf8");
const migration = fs.readFileSync(
    path.join(__dirname, "../../database/migrations/014_usuarios_roles_permisos.sql"), "utf8"
);
const marker = "-- Usuarios y permisos: estructura inicial.";

for (const mode of ["esquema nuevo", "migración 014"]) {
    test(`Usuarios: ${mode}, permisos iniciales, restricciones y consultas sin secretos`, async () => {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const name = "usuarios_test_" + process.pid;
            await client.query(`CREATE SCHEMA ${name}`);
            await client.query(`SET LOCAL search_path TO ${name},public`);
            if (mode === "esquema nuevo") {
                await client.query(schema);
            } else {
                await client.query(schema.slice(0, schema.indexOf(marker)));
                await client.query("INSERT INTO gasolinera(nombre) VALUES ('Dato previo')");
                // Conservar la transacción exterior para revertir todos los objetos de prueba.
                await client.query(migration.replace(/^BEGIN;\s*/, "").replace(/COMMIT;\s*$/, ""));
                const perfilMigration = fs.readFileSync(path.join(__dirname, "../../database/migrations/023_usuario_perfil.sql"), "utf8");
                await client.query(perfilMigration.replace(/^BEGIN;\s*/, "").replace(/COMMIT;\s*$/, ""));
                assert.equal((await client.query("SELECT nombre FROM gasolinera")).rows[0].nombre, "Dato previo");
            }
            const roles = await rolModel.findAll(client);
            assert.deepEqual(roles.map((rol) => rol.codigo), ["JEFE", "OPERADOR"]);
            const jefe = roles.find((rol) => rol.codigo === "JEFE");
            const operador = roles.find((rol) => rol.codigo === "OPERADOR");
            const all = await permisoModel.findAll(client);
            const jefePermisos = await rolPermisoModel.findByRol(jefe.id_rol, client);
            const operadorPermisos = await rolPermisoModel.findByRol(operador.id_rol, client);
            assert.deepEqual(jefePermisos, all);
            assert.deepEqual(operadorPermisos, all.filter((permiso) => !permiso.exclusivo_jefe));
            for (const codigo of ["viajes.editar", "compras.crear", "inventario.ajustar", "mantenimientos.crear", "gastos.crear", "pagos_proveedor.crear"]) {
                assert.ok(operadorPermisos.some((permiso) => permiso.codigo === codigo), codigo);
            }
            for (const codigo of ["tarifas.editar", "configuraciones.editar", "usuarios.crear", "cierres.cerrar", "cierres.reabrir", "importaciones.ejecutar"]) {
                assert.ok(jefePermisos.some((permiso) => permiso.codigo === codigo), codigo);
                assert.ok(!operadorPermisos.some((permiso) => permiso.codigo === codigo), codigo);
            }
            assert.equal((await client.query("SELECT count(*)::int AS n FROM usuario")).rows[0].n, 0);
            assert.equal((await client.query("SELECT count(*)::int AS n FROM sesion")).rows[0].n, 0);
            const data = await client.query(
                `INSERT INTO usuario(nombre_usuario,nombre,password_hash,id_rol)
                 VALUES ('operador.test','Operador de prueba','hash_sintetico_solo_test',$1)
                 RETURNING id_usuario`, [operador.id_rol]
            );
            const id = data.rows[0].id_usuario;
            const usuario = await usuarioModel.findById(id, client);
            assert.equal(usuario.rol, "OPERADOR");
            assert.equal(usuario.activo, true);
            assert.equal(Object.hasOwn(usuario, "password_hash"), false);
            const filtros = { activo: true, id_rol: operador.id_rol, limit: 50, offset: 0 };
            assert.deepEqual(await usuarioModel.findAll(filtros, client), [usuario]);
            assert.deepEqual(await usuarioModel.findAll({ ...filtros, activo: false }, client), []);
            assert.equal(await usuarioModel.findById(2147483647, client), null);
            await client.query(
                `INSERT INTO sesion(id_usuario,token_hash,fecha_expiracion)
                 VALUES ($1,$2,CURRENT_TIMESTAMP + interval '1 hour')`, [id, Buffer.alloc(32, 1)]
            );
            const sesiones = await sesionModel.findByUsuario(id, client);
            assert.equal(sesiones.length, 1);
            assert.equal(Object.hasOwn(sesiones[0], "token_hash"), false);
            const invalid = async (sql, params, code) => {
                await client.query("SAVEPOINT dato_invalido");
                await assert.rejects(client.query(sql, params), { code });
                await client.query("ROLLBACK TO SAVEPOINT dato_invalido");
            };
            await invalid("INSERT INTO usuario(nombre_usuario,nombre,password_hash,id_rol) VALUES ('operador.test','Duplicado','hash',$1)", [jefe.id_rol], "23505");
            await invalid("INSERT INTO usuario(nombre_usuario,nombre,password_hash,id_rol) VALUES ('MAYUSCULAS','Inválido','hash',$1)", [jefe.id_rol], "23514");
            await invalid("INSERT INTO usuario(nombre_usuario,nombre,password_hash,id_rol) VALUES ('sin.rol','Inválido','hash',2147483647)", [], "23503");
            await invalid("INSERT INTO sesion(id_usuario,token_hash,fecha_expiracion) VALUES ($1,$2,CURRENT_TIMESTAMP + interval '1 hour')", [id, Buffer.alloc(32, 1)], "23505");
            await invalid("INSERT INTO sesion(id_usuario,token_hash,fecha_expiracion) VALUES ($1,$2,CURRENT_TIMESTAMP + interval '1 hour')", [id, Buffer.alloc(1)], "23514");
            await invalid("INSERT INTO sesion(id_usuario,token_hash,fecha_expiracion) VALUES ($1,$2,CURRENT_TIMESTAMP)", [id, Buffer.alloc(32, 2)], "23514");
            await invalid("DELETE FROM usuario WHERE id_usuario=$1", [id], "23503");
        } finally {
            await client.query("ROLLBACK");
            client.release();
        }
    });
}
