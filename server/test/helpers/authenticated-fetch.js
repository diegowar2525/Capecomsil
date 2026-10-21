const { randomBytes, createHash } = require("node:crypto");
const config = require("../../src/config/auth");

// Fixture exclusiva de pruebas: crea una sesión real en el esquema aislado.
// El login real se prueba por separado; no hay bypass de middleware en producción.
const createAuthenticatedFetch = async (client, rol = "JEFE") => {
    const token = randomBytes(32).toString("hex");
    const result = await client.query(
        `INSERT INTO usuario(nombre_usuario, nombre, password_hash, id_rol, requiere_cambio_password)
         SELECT $1, 'Usuario de pruebas', 'hash_sintetico_solo_test', id_rol, false
         FROM rol WHERE codigo = $2 RETURNING id_usuario`,
        ["test_" + randomBytes(8).toString("hex"), rol]
    );
    const idUsuario = result.rows[0].id_usuario;
    await client.query(
        `INSERT INTO sesion(id_usuario, token_hash, fecha_expiracion)
         VALUES ($1, $2, clock_timestamp() + interval '1 hour')`,
        [idUsuario, createHash("sha256").update(token).digest()]
    );
    const cookie = `${config.cookieName}=${token}`;
    const authenticatedFetch = (url, options = {}) => {
        const headers = new Headers(options.headers);
        headers.set("Cookie", cookie);
        if (!["GET", "HEAD", "OPTIONS"].includes((options.method || "GET").toUpperCase())) {
            headers.set("Content-Type", "application/json");
            headers.set("X-CSRF-Protection", "1");
        }
        return fetch(url, { ...options, headers });
    };
    authenticatedFetch.cookie = cookie;
    authenticatedFetch.idUsuario = idUsuario;
    return authenticatedFetch;
};

module.exports = {
    createAuthenticatedFetch
};
