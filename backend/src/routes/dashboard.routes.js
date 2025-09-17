const router = require("express").Router();
const { protect } = require("../middlewares/auth.middleware");
const { getStats, getBasicStats, getDetailedStats } = require("../controllers/dashboard.controller");

// Temporarily remove authentication to test basic functionality
router.get("/", getStats);
router.get("/basic", getBasicStats);
router.get("/detailed", getDetailedStats);

module.exports = router;
