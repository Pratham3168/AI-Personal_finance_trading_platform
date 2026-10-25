const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Transaction = sequelize.define(
  'Transaction',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

    // FOREIGN KEY -> Users.id  (every row belongs to exactly one user)
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: User, key: 'id' },
      onDelete: 'CASCADE',
    },

    type: { type: DataTypes.ENUM('income', 'expense'), allowNull: false },

    // 'daily'   = a normal single entry on a specific date
    // 'monthly' = a total for the whole month (date is stored as the 1st of that month)
    entryType: { type: DataTypes.ENUM('daily', 'monthly'), allowNull: false, defaultValue: 'daily' },

    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    category: { type: DataTypes.STRING(50), allowNull: false },
    description: { type: DataTypes.STRING(255), defaultValue: '' },
    paymentMethod: { type: DataTypes.STRING(20) },
    date: { type: DataTypes.DATEONLY, allowNull: false },
  },
  {
    indexes: [{ fields: ['userId', 'date'] }, { fields: ['userId', 'type', 'category'] }],
  }
);

module.exports = Transaction;
