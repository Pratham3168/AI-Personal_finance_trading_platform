const { InvestorPreferences, InvestmentCheck } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { stockProvider, ipoProvider } = require('../providers');
const { getContext, getPreferences } = require('../services/discoverService');
const { checkStock, checkIpo, screenStocks, ipoListing, round2, inr } = require('../utils/fitChecks');
const { explainCheck } = require('../services/investAiService');

const httpError = (status, message) => Object.assign(new Error(message), { status });
const DISCLAIMER = 'Information only, not investment advice. Prices can move either way and you can lose money.';

// GET/PUT /api/discover/preferences
exports.getPreferences = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { preferences: await getPreferences(req.user.id) } });
});

exports.savePreferences = asyncHandler(async (req, res) => {
  const current = await getPreferences(req.user.id);
  const values = {
    reservedAmount: req.body.reservedAmount !== undefined ? round2(Number(req.body.reservedAmount)) : current.reservedAmount,
    perPurchaseCapPct: req.body.perPurchaseCapPct !== undefined ? Number(req.body.perPurchaseCapPct) : current.perPurchaseCapPct,
    horizonYears: req.body.horizonYears !== undefined ? Number(req.body.horizonYears) : current.horizonYears,
  };
  const row = await InvestorPreferences.findOne({ where: { userId: req.user.id } });
  if (row) await row.update(values);
  else await InvestorPreferences.create({ ...values, userId: req.user.id });
  res.json({ success: true, message: 'Preferences saved', data: { preferences: values } });
});

// GET /api/discover/capacity
exports.capacity = asyncHandler(async (req, res) => {
  const { capacity, summary } = await getContext(req.user.id);
  res.json({
    success: true,
    data: {
      capacity,
      howCalculated: [
        `Cash ${inr(capacity.cashNow)} minus emergency-fund target ${inr(capacity.emergencyTarget)} = safe room ${inr(capacity.safeRoomBeforeReserved)}`,
        `Minus money you reserved ${inr(capacity.reservedAmount)} = investable capacity ${inr(capacity.investableCapacity)}`,
        `Times your per-purchase cap ${capacity.perPurchaseCapPct}% = per-purchase limit ${inr(capacity.perPurchaseLimit)}`,
      ],
      notIncluded: 'Debts, goals and upcoming bills are only counted if you add them to "reservedAmount".',
      notes: summary.notes,
    },
  });
});

// GET /api/discover/search?q=
exports.search = asyncHandler(async (req, res) => {
  const results = await stockProvider().searchStocks(req.query.q);
  res.json({ success: true, data: { results: results.slice(0, 15) } });
});

// GET /api/discover/stocks  (screener: the user controls the filters, default sort is alphabetical)
exports.stocks = asyncHandler(async (req, res) => {
  const ctx = await getContext(req.user.id);
  const universe = await stockProvider().getUniverseFacts();
  const q = req.query;
  const { items, maxVolatilityUsed } = screenStocks(universe, ctx, {
    sector: q.sector, size: q.size,
    maxVolatility: q.maxVolatility !== undefined ? Number(q.maxVolatility) : undefined,
    excludeHeld: q.excludeHeld !== 'false', affordableOnly: q.affordableOnly !== 'false',
    sort: q.sort, order: q.order,
  });
  const page = Math.max(parseInt(q.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || 20, 1), 50);
  res.json({
    success: true,
    data: {
      dataSource: universe[0] ? universe[0].dataSource : null,
      perPurchaseLimit: ctx.capacity.perPurchaseLimit,
      filtersApplied: { maxVolatility: maxVolatilityUsed, excludeHeld: q.excludeHeld !== 'false', affordableOnly: q.affordableOnly !== 'false', sector: q.sector || null, size: q.size || null, sort: q.sort || 'name' },
      universeSize: universe.length,
      totalMatches: items.length,
      stocks: items.slice((page - 1) * limit, page * limit),
      note: 'This is a filtered list of public facts, not a recommendation. Check each company before deciding anything.',
      disclaimer: DISCLAIMER,
    },
  });
});

// GET /api/discover/ipos?status=open|upcoming|closed|listed|all
exports.ipos = asyncHandler(async (req, res) => {
  const { capacity } = await getContext(req.user.id);
  const status = req.query.status || 'active';
  const all = await ipoProvider().listIpos();
  const list = all.filter((i) => (status === 'all' ? true : status === 'active' ? ['open', 'upcoming'].includes(i.status) : i.status === status));
  res.json({
    success: true,
    data: {
      dataSource: all[0] ? all[0].dataSource : null,
      perPurchaseLimit: capacity.perPurchaseLimit,
      ipos: list.map((i) => ipoListing(i, capacity)),
      note: 'Facts only. Allotment is not guaranteed and listing price cannot be known in advance.',
      disclaimer: DISCLAIMER,
    },
  });
});

// POST /api/discover/check   { kind:'stock', symbol, amount }  or  { kind:'ipo', ipoId, lots }
exports.check = asyncHandler(async (req, res) => {
  const { kind } = req.body;
  const ctx = await getContext(req.user.id);
  let subject, facts, result, input;

  if (kind === 'stock') {
    facts = await stockProvider().getStockFacts(req.body.symbol);
    if (!facts) throw httpError(404, `No data found for symbol ${req.body.symbol}`);
    const amount = Number(req.body.amount);
    result = checkStock({ facts, amount, capacity: ctx.capacity, holdings: ctx.holdings });
    subject = `${facts.name} (${facts.symbol})`;
    input = { symbol: facts.symbol, amount };
  } else {
    facts = await ipoProvider().getIpo(req.body.ipoId);
    if (!facts) throw httpError(404, `No IPO found with id ${req.body.ipoId}`);
    const lots = Number(req.body.lots || 1);
    result = checkIpo({ ipo: facts, lots, capacity: ctx.capacity });
    subject = facts.name;
    input = { ipoId: facts.id, lots };
  }

  // The numbers are the main product. If the AI step fails, still return them.
  let aiExplanation = null, aiError = null, model = null;
  try {
    const r = await explainCheck({ currency: 'INR', kind, subject, facts, capacity: ctx.capacity, ...result });
    aiExplanation = r.analysis; model = r.model;
  } catch (e) { aiError = e.message; }

  const saved = await InvestmentCheck.create({
    userId: req.user.id, kind, subject, input, result: { ...result, capacity: ctx.capacity, facts }, aiExplanation, model,
  });

  res.json({
    success: true,
    data: { id: saved.id, kind, subject, dataSource: facts.dataSource, capacity: ctx.capacity, facts, ...result, aiExplanation, aiError, disclaimer: DISCLAIMER },
  });
});

// GET /api/discover/history
exports.history = asyncHandler(async (req, res) => {
  const rows = await InvestmentCheck.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']], limit: 20 });
  res.json({
    success: true,
    data: {
      checks: rows.map((r) => {
        const p = r.get({ plain: true });
        return { id: p.id, kind: p.kind, subject: p.subject, input: p.input, createdAt: p.createdAt, checks: p.result && p.result.checks, aiExplanation: p.aiExplanation };
      }),
    },
  });
});
