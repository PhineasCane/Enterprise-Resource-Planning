const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { ensureNumeric } = require("../utils/formatter");

const Payment = sequelize.define("Payment", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  invoiceId: { type: DataTypes.INTEGER, allowNull: false },
  customerId: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  method: { 
    type: DataTypes.ENUM('cash', 'bank_transfer', 'mobile_money', 'check', 'credit_card'), 
    allowNull: false 
  },
  reference: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'Payments',
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
Payment.beforeCreate(async (payment) => {
  if (payment.amount !== undefined) {
    payment.amount = ensureNumeric(payment.amount);
  }
});

Payment.beforeUpdate(async (payment) => {
  if (payment.changed('amount')) {
    payment.amount = ensureNumeric(payment.amount);
  }
});

// Ensure numeric fields are properly formatted when serializing to JSON
Payment.prototype.toJSON = function() {
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

module.exports = Payment;
