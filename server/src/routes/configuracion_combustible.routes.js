const router = require("express").Router();
const controller = require("../controllers/configuracion_combustible.controller");
router.get("/", controller.findAll);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);
router.get("/:id", controller.findById);
module.exports = router;
