const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PaymentDetail = sequelize.define(
  "PaymentDetail",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    bank: { type: DataTypes.STRING, allowNull: false },
    accountNumber: { type: DataTypes.STRING, allowNull: false },
    branch: { type: DataTypes.STRING, allowNull: true },
    bankCode: { type: DataTypes.STRING, allowNull: true },
    branchCode: { type: DataTypes.STRING, allowNull: true },
    swiftCode: { type: DataTypes.STRING, allowNull: true },
    isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "PaymentDetails" }
);

module.exports = PaymentDetail;


