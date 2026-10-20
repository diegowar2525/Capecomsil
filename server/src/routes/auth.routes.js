const router = require("express").Router();
const authController = require("../controllers/auth.controller");
const { autenticar, protegerCsrf } = require("../middlewares/auth.middleware");

router.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});
router.post("/login", protegerCsrf, authController.login);
router.post("/logout", protegerCsrf, authController.logout);
router.get("/me", autenticar, authController.me);
router.patch("/password", protegerCsrf, autenticar, authController.cambiarPassword);

module.exports = router;
