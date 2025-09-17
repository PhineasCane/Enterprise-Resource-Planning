const router = require("express").Router();
const ctrl = require("../controllers/expense.controller");
const { protect } = require("../middlewares/auth.middleware");
const { restrictTo } = require("../middlewares/role.middleware");

router.use(protect);

router
  .route("/")
  .get(ctrl.fetchExpenses)
  .post(restrictTo("Admin", "Manager"), ctrl.createExpense);

router
  .route("/:id")
  .get(ctrl.getExpense)
  .put(restrictTo("Admin", "Manager"), ctrl.updateExpense)
  .delete(restrictTo("Admin"), ctrl.deleteExpense);

module.exports = router;
