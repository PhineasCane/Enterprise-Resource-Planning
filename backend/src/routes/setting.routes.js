const router = require("express").Router();
const ctrl = require("../controllers/setting.controller");
const { protect } = require("../middlewares/auth.middleware");
const { restrictTo } = require("../middlewares/role.middleware");

router.use(protect);

router
  .route("/")
  .get(ctrl.fetchSettings)
  .post(restrictTo("Admin", "Manager"), ctrl.createSetting);

router
  .route("/:id")
  .put(restrictTo("Admin", "Manager"), ctrl.updateSetting)
  .delete(restrictTo("Admin"), ctrl.deleteSetting);

module.exports = router;
