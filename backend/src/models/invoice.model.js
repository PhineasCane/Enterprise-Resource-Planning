const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { ensureNumeric } = require("../utils/formatter");

const Invoice = sequelize.define("Invoice", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  number: { type: DataTypes.STRING, allowNull: false }, // Invoice number
  year: { type: DataTypes.INTEGER, allowNull: false }, // Invoice year
  customerId: { type: DataTypes.INTEGER, allowNull: false }, // Customer reference
  date: { type: DataTypes.DATEONLY, allowNull: false },
  dueDate: { type: DataTypes.DATEONLY, allowNull: false },
  status: {
    type: DataTypes.ENUM("draft", "pending", "sent", "paid", "overdue"),
    defaultValue: "draft",
  },
  subtotal: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  taxRate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  taxAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  notes: { type: DataTypes.TEXT },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  getterMethods: {
    // Ensure numeric fields are always returned as numbers
    getSubtotal() {
      return parseFloat(this.getDataValue('subtotal')) || 0;
    },
    getTaxRate() {
      return parseFloat(this.getDataValue('taxRate')) || 0;
    },
    getTaxAmount() {
      return parseFloat(this.getDataValue('taxAmount')) || 0;
    },
    getTotal() {
      return parseFloat(this.getDataValue('total')) || 0;
    }
  },
  setterMethods: {
    // Ensure numeric fields are stored as numbers
    setSubtotal(value) {
      this.setDataValue('subtotal', ensureNumeric(value));
    },
    setTaxRate(value) {
      this.setDataValue('taxRate', ensureNumeric(value));
    },
    setTaxAmount(value) {
      this.setDataValue('taxAmount', ensureNumeric(value));
    },
    setTotal(value) {
      this.setDataValue('total', ensureNumeric(value));
    }
  }
});

// Hooks to ensure numeric data integrity
Invoice.beforeCreate(async (invoice) => {
  if (invoice.subtotal !== undefined) invoice.subtotal = ensureNumeric(invoice.subtotal);
  if (invoice.taxRate !== undefined) invoice.taxRate = ensureNumeric(invoice.taxRate);
  if (invoice.taxAmount !== undefined) invoice.taxAmount = ensureNumeric(invoice.taxAmount);
  if (invoice.total !== undefined) invoice.total = ensureNumeric(invoice.total);
});

Invoice.beforeUpdate(async (invoice) => {
  if (invoice.changed('subtotal')) invoice.subtotal = ensureNumeric(invoice.subtotal);
  if (invoice.changed('taxRate')) invoice.taxRate = ensureNumeric(invoice.taxRate);
  if (invoice.changed('taxAmount')) invoice.taxAmount = ensureNumeric(invoice.taxAmount);
  if (invoice.changed('total')) invoice.total = ensureNumeric(invoice.total);
});

// Ensure numeric fields are properly formatted when serializing to JSON
Invoice.prototype.toJSON = function() {
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
  
  values.subtotal = safeParseFloat(values.subtotal);
  values.taxRate = safeParseFloat(values.taxRate);
  values.taxAmount = safeParseFloat(values.taxAmount);
  values.total = safeParseFloat(values.total);
  
  return values;
};

module.exports = Invoice;
