// src/routes/businessProfile.routes.js

const router = require("express").Router();
const multer = require("multer");
const { protect } = require("../middlewares/auth.middleware");
const { restrictTo } = require("../middlewares/role.middleware");
const businessProfileController = require("../controllers/businessProfile.controller");

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// All business profile endpoints require authentication
router.use(protect);

// Get business profile
router.get(
  "/",
  restrictTo("Admin", "Manager"),
  businessProfileController.getBusinessProfile
);

// Create business profile
router.post(
  "/",
  restrictTo("Admin"),
  upload.single('company_logo'),
  businessProfileController.createBusinessProfile
);

// Update business profile
router.put(
  "/",
  restrictTo("Admin", "Manager"),
  upload.single('company_logo'),
  businessProfileController.updateBusinessProfile
);

// Delete business profile (Admin only)
router.delete(
  "/",
  restrictTo("Admin"),
  businessProfileController.deleteBusinessProfile
);

module.exports = router;
