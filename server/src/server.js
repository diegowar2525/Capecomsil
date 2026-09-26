const app = require("./app");
const config = require("./config/env");
const pool = require("./config/database");

const PORT = config.port;

const startServer = async () => {
  try {
    await pool.query("SELECT NOW()");

    console.log("Conexión a PostgreSQL exitosa");

    app.listen(PORT, () => {
      console.log(
        `Servidor disponible en http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Error conectando a PostgreSQL:", error);
  }
};

startServer();