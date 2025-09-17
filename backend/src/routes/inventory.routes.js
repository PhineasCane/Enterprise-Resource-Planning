const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventory.controller");
const { protect } = require("../middlewares/auth.middleware");

// Apply authentication middleware to all routes
router.use(protect);

// GET /api/inventory - Fetch all inventory items
router.get("/", inventoryController.fetchInventory);

// GET /api/inventory/summary - Get inventory summary
router.get("/summary", inventoryController.getInventorySummary);

// GET /api/inventory/low-stock - Get low stock items
router.get("/low-stock", inventoryController.getLowStockItems);

// GET /api/inventory/movements - Get all inventory movements
router.get("/movements", inventoryController.getAllInventoryMovements);

// POST /api/inventory/movements - Create new inventory movement
router.post("/movements", inventoryController.createInventoryMovement);

// POST /api/inventory/stock-in - Add stock to inventory
router.post("/stock-in", inventoryController.stockIn);

// POST /api/inventory/stock-out - Remove stock from inventory
router.post("/stock-out", inventoryController.stockOut);

// GET /api/inventory/:id/movements - Get movements for specific inventory item
router.get("/:id/movements", inventoryController.getInventoryMovements);

// PUT /api/inventory/:id/reorder-level - Update reorder level
router.put("/:id/reorder-level", inventoryController.updateReorderLevel);

// GET /api/inventory/:id - Get specific inventory item (MUST BE LAST)
router.get("/:id", inventoryController.getInventory);

module.exports = router;
