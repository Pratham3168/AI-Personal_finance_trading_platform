const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const rules = require('../config/investmentRules');

const InvestorPreferences = sequelize.define('InvestorPreferences', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false, unique: true, references: { model: User, key: 'id' }, onDelete: 'CASCADE' },
  // Money the user has set aside (goals, upcoming bills, IPO funds waiting for refund). Not counted as investable.
  reservedAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  perPurchaseCapPct: { type: DataTypes.INTEGER, allowNull: false, defaultValue: rules.DEFAULT_PER_PURCHASE_CAP_PCT },
  horizonYears: { type: DataTypes.INTEGER, allowNull: false, defaultValue: rules.DEFAULT_HORIZON_YEARS },
});

module.exports = InvestorPreferences;
