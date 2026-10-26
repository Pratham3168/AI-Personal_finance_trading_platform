const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

// One row per user: the starting point for all cash and investing calculations
const InvestorProfile = sequelize.define('InvestorProfile', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: { model: User, key: 'id' },
    onDelete: 'CASCADE',
  },
  // Cash (bank + hand) the user had at the START of openingCashMonth
  openingCash: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  openingCashMonth: { type: DataTypes.STRING(7), allowNull: false }, // 'YYYY-MM'
  emergencyFundMonths: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
  riskLevel: { type: DataTypes.ENUM('low', 'medium', 'high'), allowNull: false, defaultValue: 'medium' },
});

module.exports = InvestorProfile;
