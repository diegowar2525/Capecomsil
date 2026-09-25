const { Pool } = require("pg");
const config = require("./env");

const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password
});

pool.on("connect", () => {
    console.log("Conectado a PostgreSQL");
});

pool.on("error", (error) => {
    console.error("Error inesperado en PostgreSQL:", error);
});

module.exports = pool;