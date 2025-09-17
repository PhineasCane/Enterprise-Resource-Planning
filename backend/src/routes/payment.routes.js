const router = require("express").Router();
const ctrl = require("../controllers/payment.controller");
const pdfCtrl = require("../controllers/pdf.controller");
const { protect } = require("../middlewares/auth.middleware");
const { restrictTo } = require("../middlewares/role.middleware");

router.use(protect);

router
  .route("/")
  .get(ctrl.fetchPayments)
  .post(restrictTo("Admin", "Manager"), ctrl.createPayment);

router
  .route("/:id")
  .get(ctrl.getPayment)
  .put(restrictTo("Admin", "Manager"), ctrl.updatePayment)
  .delete(restrictTo("Admin"), ctrl.deletePayment);

// PDF route
router.get("/:id/pdf", pdfCtrl.getPaymentPDF);

module.exports = router;
