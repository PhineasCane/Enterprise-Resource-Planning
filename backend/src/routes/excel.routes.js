const router = require("express").Router();
const { protect } = require("../middlewares/auth.middleware");
const { restrictTo } = require("../middlewares/role.middleware");
const excelController = require("../controllers/excel.controller");

// All Excel export endpoints require authentication
router.use(protect);

// Export customers to Excel (Admin and Manager only)
router.get(
  "/customers",
  restrictTo("Admin", "Manager"),
  excelController.exportCustomersToExcel
);

// Export invoices to Excel (Admin and Manager only)
router.get(
  "/invoices",
  restrictTo("Admin", "Manager"),
  excelController.exportInvoicesToExcel
);

module.exports = router;
