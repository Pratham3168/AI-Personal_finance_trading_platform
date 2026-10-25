const { Op } = require('sequelize');
const { Transaction } = require('../models');
const { aggregate, monthRange } = require('../utils/aggregate');

// Loads one user's transactions for a month and returns computed figures (or null if none)
exports.getMonthSummary = async (userId, month) => {
  const [start, end] = monthRange(month);
  const rows = await Transaction.findAll({
    where: { userId, date: { [Op.between]: [start, end] } },
    raw: true,
  });
  if (rows.length === 0) return null;
  return { month, ...aggregate(rows) };
};
