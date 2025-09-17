const router = require("express").Router();
const ctrl = require("../controllers/product.controller");
const { protect } = require("../middlewares/auth.middleware");
const { restrictTo } = require("../middlewares/role.middleware");

router.use(protect);

router
  .route("/")
  .get(ctrl.fetchProducts)
  .post(restrictTo("Admin", "Manager"), ctrl.createProduct);

router
  .route("/:id")
  .get(ctrl.getProduct)
  .put(restrictTo("Admin", "Manager"), ctrl.updateProduct)
  .delete(restrictTo("Admin"), ctrl.deleteProduct);

module.exports = router;
