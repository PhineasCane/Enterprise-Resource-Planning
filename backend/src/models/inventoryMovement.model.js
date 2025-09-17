const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { ensureNumeric } = require("../utils/formatter");

const InventoryMovement = sequelize.define("InventoryMovement", {
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
  type: { 
    type: DataTypes.ENUM("in", "out"), 
    allowNull: false
  },
  amount: { 
    type: DataTypes.INTEGER, 
    allowNull: false
  },
  reason: { 
    type: DataTypes.STRING,
    allowNull: false
  },
  reference: {
    type: DataTypes.STRING
  },
  previousQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  newQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  date: { 
    type: DataTypes.DATEONLY, 
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  notes: {
    type: DataTypes.TEXT
  },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'InventoryMovements',
  getterMethods: {
    // Ensure numeric fields are always returned as numbers
    getAmount() {
      return parseInt(this.getDataValue('amount')) || 0;
    },
    getPreviousQuantity() {
      return parseInt(this.getDataValue('previousQuantity')) || 0;
    },
    getNewQuantity() {
      return parseInt(this.getDataValue('newQuantity')) || 0;
    }
  },
  setterMethods: {
    // Ensure numeric fields are stored as numbers
    setAmount(value) {
      this.setDataValue('amount', ensureNumeric(value));
    },
    setPreviousQuantity(value) {
      this.setDataValue('previousQuantity', ensureNumeric(value));
    },
    setNewQuantity(value) {
      this.setDataValue('newQuantity', ensureNumeric(value));
    }
  }
});

// Hooks to ensure numeric data integrity
InventoryMovement.beforeCreate(async (movement) => {
  if (movement.amount !== undefined) movement.amount = ensureNumeric(movement.amount);
  if (movement.previousQuantity !== undefined) movement.previousQuantity = ensureNumeric(movement.previousQuantity);
  if (movement.newQuantity !== undefined) movement.newQuantity = ensureNumeric(movement.newQuantity);
});

InventoryMovement.beforeUpdate(async (movement) => {
  if (movement.changed('amount')) movement.amount = ensureNumeric(movement.amount);
  if (movement.changed('previousQuantity')) movement.previousQuantity = ensureNumeric(movement.previousQuantity);
  if (movement.changed('newQuantity')) movement.newQuantity = ensureNumeric(movement.newQuantity);
});

// Ensure numeric fields are properly formatted when serializing to JSON
InventoryMovement.prototype.toJSON = function() {
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
  
  values.amount = safeParseInt(values.amount);
  values.previousQuantity = safeParseInt(values.previousQuantity);
  values.newQuantity = safeParseInt(values.newQuantity);
  
  return values;
};

module.exports = InventoryMovement;
