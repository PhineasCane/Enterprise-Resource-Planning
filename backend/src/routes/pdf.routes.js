// src/routes/pdf.routes.js

const router = require("express").Router();
const { protect } = require("../middlewares/auth.middleware");
const { restrictTo } = require("../middlewares/role.middleware");
const pdfController = require("../controllers/pdf.controller");

// all PDF endpoints require authentication
router.use(protect);

// only certain roles can download
router.get(
  "/invoice/:id",
  restrictTo("Admin", "Manager", "User"),
  pdfController.getInvoicePDF
);

// Generate PDF from form data
router.post(
  "/generate-invoice",
  restrictTo("Admin", "Manager", "User"),
  pdfController.generateInvoiceFromData
);

module.exports = router;
