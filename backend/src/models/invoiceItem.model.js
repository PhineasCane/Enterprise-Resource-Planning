const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const InvoiceItem = sequelize.define("InvoiceItem", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  invoiceId: { type: DataTypes.INTEGER, allowNull: false }, // Reference to Invoice
  productId: { type: DataTypes.INTEGER, allowNull: false }, // Reference to Product
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  // Removed: item, description, pricePer, price, total (these come from Product model)
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

module.exports = InvoiceItem;
