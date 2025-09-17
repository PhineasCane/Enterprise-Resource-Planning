const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { ensureNumeric } = require("../utils/formatter");

const Expense = sequelize.define("Expense", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  description: { type: DataTypes.TEXT, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  vendor: { type: DataTypes.STRING },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  getterMethods: {
    // Ensure numeric fields are always returned as numbers
    getAmount() {
      return parseFloat(this.getDataValue('amount')) || 0;
    }
  },
  setterMethods: {
    // Ensure numeric fields are stored as numbers
    setAmount(value) {
      this.setDataValue('amount', ensureNumeric(value));
    }
  }
});

// Hooks to ensure numeric data integrity
Expense.beforeCreate(async (expense) => {
  if (expense.amount !== undefined) {
    expense.amount = ensureNumeric(expense.amount);
  }
});

Expense.beforeUpdate(async (expense) => {
  if (expense.changed('amount')) {
    expense.amount = ensureNumeric(expense.amount);
  }
});

// Ensure numeric fields are properly formatted when serializing to JSON
Expense.prototype.toJSON = function() {
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
  
  values.amount = safeParseFloat(values.amount);
  
  return values;
};

module.exports = Expense;
