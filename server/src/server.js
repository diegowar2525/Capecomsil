const app = require("./app");
const config = require("./config/env");
const pool = require("./config/database");
const { iniciarLimpiezaFotos } = require("./jobs/limpieza_fotos.job");

const PORT = config.port;

const startServer = async () => {
  try {
    await pool.query("SELECT NOW()");

    console.log("Conexión a PostgreSQL exitosa");

    const server = app.listen(PORT, () => {
      const detenerLimpieza = iniciarLimpiezaFotos();
      server.once("close", detenerLimpieza);
      console.log(
        `Servidor disponible en http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Error conectando a PostgreSQL:", error);
  }
};

startServer();
