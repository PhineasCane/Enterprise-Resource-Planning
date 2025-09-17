const { Inventory, InventoryMovement, Product, sequelize } = require("../models");
const { ensureNumeric } = require("../utils/formatter");

class InventoryService {
  /**
   * Get or create inventory record for a product
   */
  static async getOrCreateInventory(productId, productName) {
    try {
      let inventory = await Inventory.findOne({ where: { productId } });
      
      if (!inventory) {
        inventory = await Inventory.create({
          productId,
          productName,
          quantity: 0,
          reorderLevel: 5
        });
      }
      
      return inventory;
    } catch (error) {
      console.error('Error getting/creating inventory:', error);
      throw error;
    }
  }

  /**
   * Add stock to inventory (Stock In)
   */
  static async stockIn(productId, productName, amount, reason = 'Stock In', reference = null, notes = null) {
    const transaction = await sequelize.transaction();
    
    try {
      // Get or create inventory record
      const inventory = await this.getOrCreateInventory(productId, productName);
      
      const previousQuantity = inventory.quantity;
      const newQuantity = previousQuantity + ensureNumeric(amount);
      
      // Update inventory
      await inventory.update({
        quantity: newQuantity,
        productName: productName // Update product name in case it changed
      }, { transaction });
      
      // Record movement
      await InventoryMovement.create({
        productId,
        productName,
        type: 'in',
        amount: ensureNumeric(amount),
        reason,
        reference,
        notes,
        previousQuantity,
        newQuantity,
        date: new Date()
      }, { transaction });
      
      await transaction.commit();
      
      return {
        success: true,
        inventory,
        movement: {
          type: 'in',
          amount,
          previousQuantity,
          newQuantity
        }
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Error in stock in operation:', error);
      throw error;
    }
  }

  /**
   * Remove stock from inventory (Stock Out)
   */
  static async stockOut(productId, productName, amount, reason = 'Stock Out', reference = null, notes = null) {
    const transaction = await sequelize.transaction();
    
    try {
      // Get inventory record
      const inventory = await Inventory.findOne({ where: { productId } });
      
      if (!inventory) {
        throw new Error(`No inventory record found for product ${productId}`);
      }
      
      const previousQuantity = inventory.quantity;
      const requestedAmount = ensureNumeric(amount);
      
      // Check if enough stock available
      if (previousQuantity < requestedAmount) {
        throw new Error(`Insufficient stock. Available: ${previousQuantity}, Requested: ${requestedAmount}`);
      }
      
      const newQuantity = previousQuantity - requestedAmount;
      
      // Update inventory
      await inventory.update({
        quantity: newQuantity,
        productName: productName // Update product name in case it changed
      }, { transaction });
      
      // Record movement
      await InventoryMovement.create({
        productId,
        productName,
        type: 'out',
        amount: requestedAmount,
        reason,
        reference,
        notes,
        previousQuantity,
        newQuantity,
        date: new Date()
      }, { transaction });
      
      await transaction.commit();
      
      return {
        success: true,
        inventory,
        movement: {
          type: 'out',
          amount: requestedAmount,
          previousQuantity,
          newQuantity
        }
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Error in stock out operation:', error);
      throw error;
    }
  }

  /**
   * Get current stock level for a product
   */
  static async getCurrentStock(productId) {
    try {
      const inventory = await Inventory.findOne({ where: { productId } });
      return inventory ? inventory.quantity : 0;
    } catch (error) {
      console.error('Error getting current stock:', error);
      return 0;
    }
  }

  /**
   * Check if product has sufficient stock
   */
  static async hasSufficientStock(productId, requestedAmount) {
    try {
      const currentStock = await this.getCurrentStock(productId);
      return currentStock >= ensureNumeric(requestedAmount);
    } catch (error) {
      console.error('Error checking stock sufficiency:', error);
      return false;
    }
  }

  /**
   * Get inventory summary for all products
   */
  static async getInventorySummary() {
    try {
      const inventory = await Inventory.findAll({
        include: [{
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'description', 'pricePer', 'status']
        }],
        order: [['productName', 'ASC']]
      });
      
      return inventory.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        reorderLevel: item.reorderLevel,
        lastUpdated: item.lastUpdated,
        product: item.product,
        isLowStock: item.quantity <= item.reorderLevel
      }));
    } catch (error) {
      console.error('Error getting inventory summary:', error);
      return [];
    }
  }

  /**
   * Get inventory movements for a product
   */
  static async getProductMovements(productId, limit = 50) {
    try {
      const movements = await InventoryMovement.findAll({
        where: { productId },
        order: [['createdAt', 'DESC']],
        limit
      });
      
      return movements;
    } catch (error) {
      console.error('Error getting product movements:', error);
      return [];
    }
  }

  /**
   * Update reorder level for a product
   */
  static async updateReorderLevel(productId, newReorderLevel) {
    try {
      const inventory = await Inventory.findOne({ where: { productId } });
      
      if (!inventory) {
        throw new Error(`No inventory record found for product ${productId}`);
      }
      
      await inventory.update({
        reorderLevel: ensureNumeric(newReorderLevel)
      });
      
      return inventory;
    } catch (error) {
      console.error('Error updating reorder level:', error);
      throw error;
    }
  }
}

module.exports = InventoryService;
