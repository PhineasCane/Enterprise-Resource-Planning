const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { ensureNumeric } = require("../utils/formatter");

const Customer = sequelize.define("Customer", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  phone: { type: DataTypes.STRING, allowNull: false },
  taxPin: { type: DataTypes.STRING, allowNull: true }, // KRA PIN or Tax Registration ID
  creditLimit: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
  paymentTerms: { type: DataTypes.STRING, allowNull: false, defaultValue: "Cash" }, // e.g. Cash, Net 15, Net 30, Net 60
  address: { type: DataTypes.TEXT },
  city: { type: DataTypes.STRING, allowNull: false },
  postalCode: { type: DataTypes.STRING },
  country: { type: DataTypes.STRING, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

Customer.beforeCreate(async (cust) => {
  if (cust.creditLimit !== undefined) {
    cust.creditLimit = ensureNumeric(cust.creditLimit);
  }
});

Customer.beforeUpdate(async (cust) => {
  if (cust.changed("creditLimit")) {
    cust.creditLimit = ensureNumeric(cust.creditLimit);
  }
});

module.exports = Customer;
