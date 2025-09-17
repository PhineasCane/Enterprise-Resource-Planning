const { Inventory, InventoryMovement, Product } = require("../models");
const { getPagination, getPagingData } = require("../utils/pagination");
const InventoryService = require("../services/inventory.service");

// GET /api/inventory
exports.fetchInventory = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = "" } = req.query;
    const where = search
      ? { 
          [require("sequelize").Op.or]: [
            { productName: { [require("sequelize").Op.like]: `%${search}%` } },
            { productId: search }
          ]
        }
      : {};
  const { limit, offset } = getPagination(page, pageSize);

  const data = await Inventory.findAndCountAll({
      where,
    limit,
    offset,
      order: [["productName", "ASC"]],
      include: [
        { 
          model: Product, 
          as: 'product',
          attributes: ['id', 'name', 'description', 'pricePer', 'status']
        }
      ]
    });

    // Transform the data to include computed fields
    const transformedRows = data.rows.map(item => {
      const itemData = item.toJSON();
      return {
        ...itemData,
        isLowStock: itemData.quantity <= itemData.reorderLevel,
        product: itemData.product || null
      };
    });

    // Return empty result if no inventory items found
    if (data.count === 0) {
      return res.json({
        items: [],
        total: 0,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: 0
      });
    }

    res.json(getPagingData({ ...data, rows: transformedRows }, +page, +pageSize));
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: "Error fetching inventory", error: error.message });
  }
};

// GET /api/inventory/:id
exports.getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByPk(req.params.id, {
      include: [
        { 
          model: Product, 
          as: 'product',
          attributes: ['id', 'name', 'description', 'pricePer', 'status']
        }
      ]
    });
    
    if (!inventory) {
      return res.status(404).json({ message: "Inventory record not found" });
    }

    const inventoryData = inventory.toJSON();
    const transformedInventory = {
      ...inventoryData,
      isLowStock: inventoryData.quantity <= inventoryData.reorderLevel,
      product: inventoryData.product || null
    };

    res.json(transformedInventory);
  } catch (error) {
    console.error('Error getting inventory:', error);
    res.status(500).json({ message: "Error getting inventory", error: error.message });
  }
};

// POST /api/inventory/stock-in
exports.stockIn = async (req, res) => {
  try {
    const { productId, productName, amount, reason, reference, notes } = req.body;

    if (!productId || !productName || !amount) {
      return res.status(400).json({ 
        message: "Missing required fields: productId, productName, and amount are required" 
      });
    }

    const result = await InventoryService.stockIn(
      parseInt(productId),
      productName,
      parseInt(amount),
      reason || 'Stock In',
      reference,
      notes
    );

    res.json({
      message: "Stock added successfully",
      ...result
    });
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(500).json({ message: "Error adding stock", error: error.message });
  }
};

// POST /api/inventory/stock-out
exports.stockOut = async (req, res) => {
  try {
    const { productId, productName, amount, reason, reference, notes } = req.body;

    if (!productId || !productName || !amount) {
      return res.status(400).json({ 
        message: "Missing required fields: productId, productName, and amount are required" 
      });
    }

    const result = await InventoryService.stockOut(
      parseInt(productId),
      productName,
      parseInt(amount),
      reason || 'Stock Out',
      reference,
      notes
    );

    res.json({
      message: "Stock removed successfully",
      ...result
    });
  } catch (error) {
    console.error('Error removing stock:', error);
    res.status(500).json({ message: "Error removing stock", error: error.message });
  }
};

// PUT /api/inventory/:id/reorder-level
exports.updateReorderLevel = async (req, res) => {
  try {
    const { reorderLevel } = req.body;

    if (reorderLevel === undefined || reorderLevel < 0) {
      return res.status(400).json({ 
        message: "Reorder level must be a non-negative number" 
      });
    }

    const result = await InventoryService.updateReorderLevel(
      parseInt(req.params.id),
      parseInt(reorderLevel)
    );

    res.json({
      message: "Reorder level updated successfully",
      inventory: result
    });
  } catch (error) {
    console.error('Error updating reorder level:', error);
    res.status(500).json({ message: "Error updating reorder level", error: error.message });
  }
};

// GET /api/inventory/:id/movements
exports.getInventoryMovements = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const movements = await InventoryService.getProductMovements(
      parseInt(req.params.id),
      parseInt(limit)
    );

    res.json(movements);
  } catch (error) {
    console.error('Error getting inventory movements:', error);
    res.status(500).json({ message: "Error getting inventory movements", error: error.message });
  }
};

// GET /api/inventory/movements - Get all inventory movements
exports.getAllInventoryMovements = async (req, res) => {
  try {
    const { page = 1, pageSize = 50 } = req.query;
  const { limit, offset } = getPagination(page, pageSize);

  const data = await InventoryMovement.findAndCountAll({
    limit,
    offset,
      order: [["createdAt", "DESC"]],
      include: [
        { 
          model: Product, 
          as: 'product',
          attributes: ['id', 'name', 'description', 'pricePer', 'status']
        }
      ]
    });

    // Transform the data
    const transformedRows = data.rows.map(movement => {
      const movementData = movement.toJSON();
      return {
        ...movementData,
        product: movementData.product || null
      };
    });

    // Return empty result if no movements found
    if (data.count === 0) {
      return res.json({
        items: [],
        total: 0,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: 0
      });
    }

    res.json(getPagingData({ ...data, rows: transformedRows }, +page, +pageSize));
  } catch (error) {
    console.error('Error getting all inventory movements:', error);
    res.status(500).json({ message: "Error getting all inventory movements", error: error.message });
  }
};

// POST /api/inventory/movements - Create new inventory movement
exports.createInventoryMovement = async (req, res) => {
  try {
    const { productId, productName, type, amount, reason, reference, notes } = req.body;

    if (!productId || !productName || !type || !amount) {
      return res.status(400).json({ 
        message: "Missing required fields: productId, productName, type, and amount are required" 
      });
    }

    // Validate type
    if (!['in', 'out'].includes(type)) {
      return res.status(400).json({ 
        message: "Invalid type. Must be 'in' or 'out'" 
      });
    }

    // Get current inventory
    let inventory = await Inventory.findOne({ where: { productId } });
    if (!inventory) {
      return res.status(404).json({ 
        message: "No inventory record found for this product" 
      });
    }

    const previousQuantity = inventory.quantity;
    let newQuantity;

    if (type === 'in') {
      newQuantity = previousQuantity + parseInt(amount);
    } else {
      if (previousQuantity < parseInt(amount)) {
        return res.status(400).json({ 
          message: `Insufficient stock. Available: ${previousQuantity}, Requested: ${amount}` 
        });
      }
      newQuantity = previousQuantity - parseInt(amount);
    }

    // Create movement record
  const movement = await InventoryMovement.create({
    productId,
      productName,
    type,
      amount: parseInt(amount),
      reason: reason || `${type === 'in' ? 'Stock In' : 'Stock Out'}`,
      reference,
      notes,
      previousQuantity,
      newQuantity,
      date: new Date()
    });

    // Update inventory quantity
    await inventory.update({ 
      quantity: newQuantity,
      lastUpdated: new Date()
    });

    res.status(201).json({
      message: "Inventory movement created successfully",
      movement,
      inventory: {
        id: inventory.id,
        productId: inventory.productId,
        quantity: newQuantity,
        previousQuantity
      }
    });
  } catch (error) {
    console.error('Error creating inventory movement:', error);
    res.status(500).json({ message: "Error creating inventory movement", error: error.message });
  }
};

// GET /api/inventory/summary
exports.getInventorySummary = async (req, res) => {
  try {
    const summary = await InventoryService.getInventorySummary();
    res.json(summary);
  } catch (error) {
    console.error('Error getting inventory summary:', error);
    res.status(500).json({ message: "Error getting inventory summary", error: error.message });
  }
};

// GET /api/inventory/low-stock
exports.getLowStockItems = async (req, res) => {
  try {
  const { page = 1, pageSize = 10 } = req.query;
  const { limit, offset } = getPagination(page, pageSize);

    const data = await Inventory.findAndCountAll({
      where: {
        quantity: {
          [require("sequelize").Op.lte]: require("sequelize").col('reorderLevel')
        }
      },
    limit,
    offset,
      order: [["quantity", "ASC"]],
      include: [
        { 
          model: Product, 
          as: 'product',
          attributes: ['id', 'name', 'description', 'pricePer', 'status']
        }
      ]
    });

    // Transform the data to include computed fields
    const transformedRows = data.rows.map(item => {
      const itemData = item.toJSON();
      return {
        ...itemData,
        isLowStock: true,
        product: itemData.product || null
      };
    });

    res.json(getPagingData({ ...data, rows: transformedRows }, +page, +pageSize));
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ message: "Error fetching low stock items", error: error.message });
  }
};
