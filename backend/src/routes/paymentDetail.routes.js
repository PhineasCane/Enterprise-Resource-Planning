const router = require("express").Router();
const { protect } = require("../middlewares/auth.middleware");
const ctrl = require("../controllers/paymentDetail.controller");

router.get("/", protect, ctrl.list);
router.post("/", protect, ctrl.create);
router.patch("/:id", protect, ctrl.update);
router.delete("/:id", protect, ctrl.remove);

module.exports = router;


