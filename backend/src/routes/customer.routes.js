const router = require("express").Router();
const ctrl = require("../controllers/customer.controller");
const { protect } = require("../middlewares/auth.middleware");
const { restrictTo } = require("../middlewares/role.middleware");

router.use(protect);

router
  .route("/")
  .get(ctrl.fetchCustomers)
  .post(restrictTo("Admin", "Manager"), ctrl.createCustomer);

router
  .route("/:id")
  .get(ctrl.getCustomer)
  .put(restrictTo("Admin", "Manager"), ctrl.updateCustomer)
  .delete(restrictTo("Admin"), ctrl.deleteCustomer);

module.exports = router;
