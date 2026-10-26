const { Op } = require('sequelize');
const { InvestorProfile, InvestmentTransaction } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { monthRange, currentMonth, round2 } = require('../utils/aggregate');
const { replay, summarisePositions } = require('../utils/ledger');
const { loadLedger, normaliseLedgerRow, buildInvestmentSummary } = require('../services/investmentService');

const httpError = (status, message) => Object.assign(new Error(message), { status });

const profileDto = (p) => ({
  openingCash: Number(p.openingCash),
  openingCashMonth: p.openingCashMonth,
  emergencyFundMonths: p.emergencyFundMonths,
  riskLevel: p.riskLevel,
});

// GET /api/investments/profile
exports.getProfile = asyncHandler(async (req, res) => {
  const p = await InvestorProfile.findOne({ where: { userId: req.user.id } });
  if (!p) throw httpError(404, 'Investor profile not set yet');
  res.json({ success: true, data: { profile: profileDto(p) } });
});

// PUT /api/investments/profile  (creates or updates)
exports.saveProfile = asyncHandler(async (req, res) => {
  const { openingCash, openingCashMonth, emergencyFundMonths, riskLevel } = req.body;
  const values = { openingCash: round2(Number(openingCash)), openingCashMonth };
  if (emergencyFundMonths !== undefined) values.emergencyFundMonths = Number(emergencyFundMonths);
  if (riskLevel !== undefined) values.riskLevel = riskLevel;

  let p = await InvestorProfile.findOne({ where: { userId: req.user.id } });
  if (p) await p.update(values);
  else p = await InvestorProfile.create({ ...values, userId: req.user.id });
  res.json({ success: true, message: 'Investor profile saved', data: { profile: profileDto(p) } });
});

// POST /api/investments/transactions
exports.createEntry = asyncHandler(async (req, res) => {
  const b = req.body;
  const data = {
    type: b.type,
    symbol: b.symbol,
    exchange: b.exchange || 'NSE',
    companyName: (b.companyName || '').trim() || null,
    fees: round2(Number(b.fees || 0)),
    date: b.date,
    note: (b.note || '').trim(),
  };
  if (b.type === 'dividend') {
    Object.assign(data, { amount: round2(Number(b.amount)), quantity: null, pricePerUnit: null, fees: 0 });
  } else {
    const quantity = Number(b.quantity);
    const pricePerUnit = round2(Number(b.pricePerUnit));
    Object.assign(data, { quantity, pricePerUnit, amount: round2(quantity * pricePerUnit) });
  }

  // Duplicate check (same trade entered twice)
  if (!b.allowDuplicate) {
    const dup = await InvestmentTransaction.findOne({
      where: {
        userId: req.user.id, type: data.type, symbol: data.symbol, exchange: data.exchange,
        date: data.date, quantity: data.quantity, amount: data.amount,
      },
    });
    if (dup) throw httpError(409, 'This looks like a duplicate entry. Send "allowDuplicate": true to save it anyway.');
  }

  // Rule check: replay this symbol's ledger with the new entry (e.g. blocks selling more than held)
  const existing = await loadLedger(req.user.id, { symbol: data.symbol, exchange: data.exchange });
  const { errors } = replay([...existing, { ...data, id: 'new', createdAt: new Date() }]);
  if (errors.length) throw httpError(422, errors[0]);

  const row = await InvestmentTransaction.create({ ...data, userId: req.user.id });
  res.status(201).json({
    success: true,
    message: 'Investment entry saved',
    data: { entry: normaliseLedgerRow(row.get({ plain: true })) },
  });
});

// GET /api/investments/transactions?symbol=&type=&month=&page=&limit=
exports.listEntries = asyncHandler(async (req, res) => {
  const { symbol, type, month } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  const where = { userId: req.user.id };
  if (symbol) where.symbol = symbol.toUpperCase();
  if (type) where.type = type;
  if (month) where.date = { [Op.between]: monthRange(month) };

  const { rows, count } = await InvestmentTransaction.findAndCountAll({
    where, order: [['date', 'DESC'], ['createdAt', 'DESC']], limit, offset: (page - 1) * limit, raw: true,
  });
  res.json({
    success: true,
    data: {
      entries: rows.map(normaliseLedgerRow),
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    },
  });
});

// DELETE /api/investments/transactions/:id  (blocked if later entries depend on it)
exports.deleteEntry = asyncHandler(async (req, res) => {
  const row = await InvestmentTransaction.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!row) throw httpError(404, 'Investment entry not found');

  const same = await loadLedger(req.user.id, { symbol: row.symbol, exchange: row.exchange });
  const { errors } = replay(same.filter((e) => e.id !== row.id));
  if (errors.length) throw httpError(409, `Cannot delete: later entries depend on it. ${errors[0]}`);

  await row.destroy();
  res.json({ success: true, message: 'Investment entry deleted' });
});

// GET /api/investments/holdings
exports.holdings = asyncHandler(async (req, res) => {
  const ledger = await loadLedger(req.user.id);
  const { positions, errors } = replay(ledger);
  res.json({
    success: true,
    data: { ...summarisePositions(positions), weightBasis: 'cost', ledgerProblems: errors },
  });
});

// GET /api/investments/summary?month=YYYY-MM
exports.summary = asyncHandler(async (req, res) => {
  const month = req.query.month || currentMonth();
  const summary = await buildInvestmentSummary(req.user.id, month);
  res.json({ success: true, data: { summary } });
});
