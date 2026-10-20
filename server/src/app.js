const express = require("express");
const cors = require("cors");
const authConfig = require("./config/auth");

const routes = require("./routes");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

app.use(cors({
    origin: (origin, callback) => {
        callback(null, Boolean(origin && authConfig.origins.includes(origin)));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "X-CSRF-Protection"]
}));
app.use(express.json());

app.use("/api", routes);

app.use(errorHandler);

module.exports = app;
