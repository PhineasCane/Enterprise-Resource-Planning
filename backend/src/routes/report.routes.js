const router = require("express").Router();
const { protect } = require("../middlewares/auth.middleware");
const ctrl = require("../controllers/report.controller");

// Test route (no auth required)
router.get("/test", ctrl.testReports);

// Main reports route (auth required)
router.get("/", protect, ctrl.getReports);

module.exports = router;
