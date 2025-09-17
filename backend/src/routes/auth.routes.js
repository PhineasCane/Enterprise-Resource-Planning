const router = require("express").Router();
const { register, login, getCurrentUser } = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getCurrentUser);

module.exports = router;
