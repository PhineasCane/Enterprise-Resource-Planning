const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { ensureNumeric } = require("../utils/formatter");

const Product = sequelize.define("Product", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  pricePer: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  status: { 
    type: DataTypes.ENUM('active', 'inactive', 'discontinued'), 
    defaultValue: 'active' 
  },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

// Hooks to ensure numeric data integrity
Product.beforeCreate(async (product) => {
  if (product.pricePer !== undefined) {
    product.pricePer = ensureNumeric(product.pricePer);
  }
});

Product.beforeUpdate(async (product) => {
  if (product.changed('pricePer')) {
    product.pricePer = ensureNumeric(product.pricePer);
  }
});

// Virtual getter methods on prototype
Product.prototype.getPricePer = function() {
  return parseFloat(this.getDataValue('pricePer')) || 0;
};

Product.prototype.getQuantity = function() {
  if (this.inventory && this.inventory.quantity !== undefined) {
    return parseInt(this.inventory.quantity) || 0;
  }
  return 0;
};

Product.prototype.getTotalPrice = function() {
  const quantity = this.getQuantity();
  const pricePer = this.getPricePer();
  return quantity * pricePer;
};

// Ensure numeric fields are properly formatted when serializing to JSON
Product.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Convert numeric fields to numbers
  const safeParseFloat = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    if (value && typeof value === 'object' && value.toString) {
      return parseFloat(value.toString()) || 0;
    }
    return 0;
  };
  
  values.pricePer = safeParseFloat(values.pricePer);
  
  // Add virtual fields
  values.quantity = this.getQuantity();
  values.totalPrice = this.getTotalPrice();
  
  return values;
};

module.exports = Product;
