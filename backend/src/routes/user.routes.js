const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/user.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");

// Apply authentication middleware to all routes
router.use(protect);

// GET /api/users - Fetch all users (Admin and Manager only)
router.get("/", restrictTo("Admin", "Manager"), ctrl.fetchUsers);

// GET /api/users/roles - Get available roles (Admin and Manager only)
router.get("/roles", restrictTo("Admin", "Manager"), ctrl.getRoles);

// GET /api/users/:id - Get specific user (Admin and Manager only)
router.get("/:id", restrictTo("Admin", "Manager"), ctrl.getUser);

// POST /api/users - Create new user (Admin only)
router.post("/", restrictTo("Admin"), ctrl.createUser);

// PUT /api/users/:id - Update user (Admin and Manager can update Staff, Admin can update all)
router.put("/:id", restrictTo("Admin", "Manager"), ctrl.updateUser);

// DELETE /api/users/:id - Delete user (Admin only)
router.delete("/:id", restrictTo("Admin"), ctrl.deleteUser);

module.exports = router;
