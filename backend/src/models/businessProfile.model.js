const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const BusinessProfile = sequelize.define("BusinessProfile", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  company_logo: DataTypes.BLOB, // Store actual image binary data
  logo_type: DataTypes.STRING, // Store MIME type (e.g., "image/png", "image/jpeg")
  logo_name: DataTypes.STRING, // Store original filename
  
  // Individual company fields instead of nested settings
  company_name: { type: DataTypes.STRING, allowNull: false },
  company_address: DataTypes.TEXT,
  company_city: DataTypes.STRING(100),
  company_country: DataTypes.STRING(100),
  company_phone: DataTypes.STRING(50),
  company_email: DataTypes.STRING,
  company_website: DataTypes.STRING,
  company_reg_number: DataTypes.STRING(100),
  currency: { type: DataTypes.STRING(10), defaultValue: 'KSH' },
  invoice_footer: DataTypes.TEXT,
  
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'BusinessProfiles'
});

module.exports = BusinessProfile;
