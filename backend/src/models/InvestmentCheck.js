const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

// Audit trail: every fit check the user ran, with the numbers and the AI text that was shown
const InvestmentCheck = sequelize.define('InvestmentCheck', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false, references: { model: User, key: 'id' }, onDelete: 'CASCADE' },
  kind: { type: DataTypes.ENUM('stock', 'ipo'), allowNull: false },
  subject: { type: DataTypes.STRING(150), allowNull: false },
  input: { type: DataTypes.JSON },
  result: { type: DataTypes.JSON },
  aiExplanation: { type: DataTypes.JSON },
  model: { type: DataTypes.STRING(60) },
}, { indexes: [{ fields: ['userId', 'createdAt'] }] });

module.exports = InvestmentCheck;
