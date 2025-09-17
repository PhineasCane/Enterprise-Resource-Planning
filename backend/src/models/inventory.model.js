const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { ensureNumeric } = require("../utils/formatter");

const Inventory = sequelize.define("Inventory", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Products',
      key: 'id'
    }
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  reorderLevel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5
  },
  lastUpdated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'Inventory',
  getterMethods: {
    // Ensure numeric fields are always returned as numbers
    getQuantity() {
      return parseInt(this.getDataValue('quantity')) || 0;
    },
    getReorderLevel() {
      return parseInt(this.getDataValue('reorderLevel')) || 5;
    }
  },
  setterMethods: {
    // Ensure numeric fields are stored as numbers
    setQuantity(value) {
      this.setDataValue('quantity', ensureNumeric(value));
    },
    setReorderLevel(value) {
      this.setDataValue('reorderLevel', ensureNumeric(value));
    }
  }
});

// Hooks to ensure numeric data integrity
Inventory.beforeCreate(async (inventory) => {
  if (inventory.quantity !== undefined) inventory.quantity = ensureNumeric(inventory.quantity);
  if (inventory.reorderLevel !== undefined) inventory.reorderLevel = ensureNumeric(inventory.reorderLevel);
  inventory.lastUpdated = new Date();
});

Inventory.beforeUpdate(async (inventory) => {
  if (inventory.changed('quantity') || inventory.changed('reorderLevel')) {
    inventory.lastUpdated = new Date();
  }
  if (inventory.changed('quantity')) inventory.quantity = ensureNumeric(inventory.quantity);
  if (inventory.changed('reorderLevel')) inventory.reorderLevel = ensureNumeric(inventory.reorderLevel);
});

// Ensure numeric fields are properly formatted when serializing to JSON
Inventory.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Convert numeric fields to numbers
  const safeParseInt = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseInt(value) || 0;
    if (value && typeof value === 'object' && value.toString) {
      return parseInt(value.toString()) || 0;
    }
    return 0;
  };
  
  values.quantity = safeParseInt(values.quantity);
  values.reorderLevel = safeParseInt(values.reorderLevel);
  
  return values;
};

module.exports = Inventory;
