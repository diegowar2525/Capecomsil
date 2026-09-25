const app = require("./app");
const config = require("./config/env");

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Servidor disponible en http://localhost:${PORT}`);
});