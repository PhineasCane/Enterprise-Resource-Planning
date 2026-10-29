const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { ensureNumeric } = require("../utils/formatter");

const InvoiceItem = sequelize.define("InvoiceItem", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  invoiceId: { type: DataTypes.INTEGER, allowNull: false }, // Reference to Invoice
  productId: { type: DataTypes.INTEGER, allowNull: false }, // Reference to Product
  productName: { type: DataTypes.STRING, allowNull: true }, // Snapshotted product name
  description: { type: DataTypes.TEXT, allowNull: true }, // Snapshotted description
  unitPrice: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 }, // Snapshotted unit price
  pricePer: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 }, // Alias for unitPrice
  total: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 }, // Snapshotted line total
  discount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 }, // Discount if any
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: "InvoiceItems",
  getterMethods: {
    getUnitPrice() {
      return parseFloat(this.getDataValue("unitPrice")) || parseFloat(this.getDataValue("pricePer")) || 0;
    },
    getPricePer() {
      return parseFloat(this.getDataValue("pricePer")) || parseFloat(this.getDataValue("unitPrice")) || 0;
    },
    getTotal() {
      return parseFloat(this.getDataValue("total")) || 0;
    }
  }
});

InvoiceItem.beforeCreate(async (item) => {
  if (item.unitPrice !== undefined) item.unitPrice = ensureNumeric(item.unitPrice);
  if (item.pricePer !== undefined) item.pricePer = ensureNumeric(item.pricePer);
  if (item.total !== undefined) item.total = ensureNumeric(item.total);
  if (item.discount !== undefined) item.discount = ensureNumeric(item.discount);
});

InvoiceItem.beforeUpdate(async (item) => {
  if (item.changed("unitPrice")) item.unitPrice = ensureNumeric(item.unitPrice);
  if (item.changed("pricePer")) item.pricePer = ensureNumeric(item.pricePer);
  if (item.changed("total")) item.total = ensureNumeric(item.total);
  if (item.changed("discount")) item.discount = ensureNumeric(item.discount);
});

module.exports = InvoiceItem;
