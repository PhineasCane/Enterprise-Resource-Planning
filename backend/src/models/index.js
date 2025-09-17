const sequelize = require("../config/db");
const User = require("./user.model");
const Customer = require("./customer.model");
const Product = require("./product.model");
const Invoice = require("./invoice.model");
const InvoiceItem = require("./invoiceItem.model");
const Payment = require("./payment.model");
const Expense = require("./expense.model");
const Inventory = require("./inventory.model");
const InventoryMovement = require("./inventoryMovement.model");
const BusinessProfile = require("./businessProfile.model");
const Setting = require("./setting.model");
const ContactDetail = require("./contactDetail.model");
const PaymentDetail = require("./paymentDetail.model");

// User associations
User.hasMany(Invoice, { as: "invoices", foreignKey: "userId" });
Invoice.belongsTo(User, { as: "user", foreignKey: "userId" });

// Customer associations
Customer.hasMany(Invoice, { as: "invoices", foreignKey: "customerId" });
Invoice.belongsTo(Customer, { as: "Customer", foreignKey: "customerId" });

Customer.hasMany(Payment, { as: "payments", foreignKey: "customerId" });
Payment.belongsTo(Customer, { as: "Customer", foreignKey: "customerId" });

// Product associations
Product.hasMany(InvoiceItem, { as: "invoiceItems", foreignKey: "productId" });
InvoiceItem.belongsTo(Product, { as: "Product", foreignKey: "productId" });

// Product has one inventory record
Product.hasOne(Inventory, { as: "inventory", foreignKey: "productId" });
Inventory.belongsTo(Product, { as: "product", foreignKey: "productId" });

// Product has many inventory movements
Product.hasMany(InventoryMovement, { as: "movements", foreignKey: "productId" });
InventoryMovement.belongsTo(Product, { as: "product", foreignKey: "productId" });

// Invoice associations
Invoice.hasMany(InvoiceItem, { as: "items", foreignKey: "invoiceId" });
InvoiceItem.belongsTo(Invoice, { as: "Invoice", foreignKey: "invoiceId" });

Invoice.hasMany(Payment, { as: "payments", foreignKey: "invoiceId" });
Payment.belongsTo(Invoice, { as: "Invoice", foreignKey: "invoiceId" });

// Inventory associations
// Inventory has many inventory movements through the product relationship
// Since InventoryMovement.productId references Product.id, not Inventory.id
// We don't need a direct association here

// Log successful association establishment
console.log('✅ All model associations defined successfully');

module.exports = {
  sequelize,
  User,
  Customer,
  Product,
  Invoice,
  InvoiceItem,
  Payment,
  Expense,
  Inventory,
  InventoryMovement,
  BusinessProfile,
  Setting,
  ContactDetail,
  PaymentDetail,
};
