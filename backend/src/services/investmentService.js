const { Op } = require('sequelize');
const { Transaction, InvestmentTransaction, InvestorProfile } = require('../models');
const { monthRange, shiftMonth } = require('../utils/aggregate');
const { composeSummary } = require('../utils/investmentSummary');

const httpError = (status, message) => Object.assign(new Error(message), { status });
const toDateStr = (d) => (typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10));
const num = (v) => (v === null || v === undefined ? null : Number(v));

const normaliseLedgerRow = (r) => ({
  id: r.id,
  type: r.type,
  symbol: r.symbol,
  exchange: r.exchange,
  companyName: r.companyName,
  quantity: num(r.quantity),
  pricePerUnit: num(r.pricePerUnit),
  amount: Number(r.amount),
  fees: Number(r.fees),
  date: toDateStr(r.date),
  note: r.note,
  createdAt: r.createdAt,
});

exports.normaliseLedgerRow = normaliseLedgerRow;

exports.loadLedger = async (userId, filter = {}) => {
  const rows = await InvestmentTransaction.findAll({ where: { userId, ...filter }, raw: true });
  return rows.map(normaliseLedgerRow);
};

exports.buildInvestmentSummary = async (userId, month) => {
  const profile = await InvestorProfile.findOne({ where: { userId }, raw: true });
  if (!profile) throw httpError(409, 'Set up your investor profile first: PUT /api/investments/profile');
  if (month < profile.openingCashMonth) {
    throw httpError(422, `month cannot be earlier than your openingCashMonth (${profile.openingCashMonth})`);
  }

  // Load from the earlier of: opening month, or 2 months before the requested month (for the expense average)
  const prior = shiftMonth(month, -2);
  const fromMonth = profile.openingCashMonth < prior ? profile.openingCashMonth : prior;
  const [start] = monthRange(fromMonth);
  const [, end] = monthRange(month);

  const txRows = (
    await Transaction.findAll({ where: { userId, date: { [Op.between]: [start, end] } }, raw: true })
  ).map((r) => ({ ...r, date: toDateStr(r.date) }));

  const ledger = await exports.loadLedger(userId);
  return composeSummary({ profile, txRows, ledger, month });
};
