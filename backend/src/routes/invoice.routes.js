const router = require("express").Router();
const ctrl = require("../controllers/invoice.controller");
const { protect } = require("../middlewares/auth.middleware");
const { restrictTo } = require("../middlewares/role.middleware");

router.use(protect);

router
  .route("/")
  .get(ctrl.fetchInvoices)
  .post(restrictTo("Admin", "Manager"), ctrl.createInvoice);

router
  .route("/:id")
  .get(ctrl.getInvoice)
  .put(restrictTo("Admin", "Manager"), ctrl.updateInvoice)
  .patch(restrictTo("Admin", "Manager"), ctrl.updateInvoiceStatus)
  .delete(restrictTo("Admin"), ctrl.deleteInvoice);

module.exports = router;
