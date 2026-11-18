const fs = require('node:fs');
const path = require('node:path');
const pool = require('../src/config/database');

async function main() {
    const c = await pool.connect();
    try {
        await c.query('BEGIN');
        await c.query('SELECT pg_advisory_xact_lock(72631,1)');
        if ((await c.query("SELECT to_regclass('public.banco') AS tabla")).rows[0].tabla) {
            throw new Error('La tabla banco ya existe; no se volvió a aplicar la migración.');
        }
        await c.query('LOCK TABLE pago IN ACCESS EXCLUSIVE MODE');
        const before = (await c.query('SELECT * FROM pago ORDER BY id_pago')).rows;
        await c.query(fs.readFileSync(path.join(__dirname, '../../database/migrations/043_bancos.sql'), 'utf8'));
        const after = (await c.query('SELECT * FROM pago ORDER BY id_pago')).rows.map(({ id_banco, ...row }) => row);
        require('node:assert/strict').deepEqual(after, before);
        const counts = (await c.query('SELECT (SELECT count(*) FROM banco) bancos, (SELECT count(*) FROM pago WHERE id_banco IS NOT NULL) cobros_vinculados')).rows[0];
        await c.query('COMMIT');
        console.log('Migración 043 aplicada; cobros originales conservados.', counts);
    } catch (error) {
        await c.query('ROLLBACK');
        throw error;
    } finally {
        c.release();
        await pool.end();
    }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
