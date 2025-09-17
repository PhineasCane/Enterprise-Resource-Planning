const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Setting = sequelize.define("Setting", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  key: { type: DataTypes.STRING, unique: true, allowNull: false },
  value: { type: DataTypes.TEXT, allowNull: false },
  description: DataTypes.STRING,
});

module.exports = Setting;
