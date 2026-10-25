const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

// The investment ledger: every buy, sell and dividend. Holdings are calculated from this.
const InvestmentTransaction = sequelize.define(
  'InvestmentTransaction',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: User, key: 'id' },
      onDelete: 'CASCADE',
    },
    type: { type: DataTypes.ENUM('buy', 'sell', 'dividend'), allowNull: false },
    symbol: { type: DataTypes.STRING(20), allowNull: false },
    companyName: { type: DataTypes.STRING(100) },
    exchange: { type: DataTypes.ENUM('NSE', 'BSE'), allowNull: false, defaultValue: 'NSE' },
    quantity: { type: DataTypes.INTEGER }, // null for dividends
    pricePerUnit: { type: DataTypes.DECIMAL(12, 2) }, // null for dividends
    amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false }, // quantity x price, or total dividend received
    fees: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 }, // brokerage, taxes, charges
    date: { type: DataTypes.DATEONLY, allowNull: false },
    note: { type: DataTypes.STRING(255), defaultValue: '' },
  },
  { indexes: [{ fields: ['userId', 'date'] }, { fields: ['userId', 'symbol'] }] }
);

module.exports = InvestmentTransaction;
