// Pure functions. Code does the maths; there is no score and no verdict, only checks against the user's OWN settings.
const rules = require('../config/investmentRules');

const round2 = (n) => Math.round(n * 100) / 100;
const pct = (a, b) => (b > 0 ? round2((a / b) * 100) : null);
const inr = (n) => `₹${round2(n).toLocaleString('en-IN')}`;
const chk = (id, label, status, detail) => ({ id, label, status, detail }); // status: within | outside | unknown | info

function ageDays(dateStr) {
  const d = new Date(`${String(dateStr).slice(0, 10)}T00:00:00Z`).getTime();
  const t = new Date();
  return Math.floor((Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()) - d) / 86400000);
}

function buildCapacity(summary, prefs) {
  const reserved = Number(prefs.reservedAmount || 0);
  const safeRoom = summary.emergencyFund.safeToInvestRoom;
  const investable = Math.max(0, safeRoom - reserved);
  const capPct = prefs.perPurchaseCapPct;
  return {
    cashNow: summary.cash.cashAtMonthEnd,
    emergencyTarget: summary.emergencyFund.target,
    safeRoomBeforeReserved: safeRoom,
    reservedAmount: round2(reserved),
    investableCapacity: round2(investable),
    perPurchaseCapPct: capPct,
    perPurchaseLimit: round2((investable * capPct) / 100),
    portfolioCostBasis: summary.portfolio.costBasisTotal,
    netWorthAtCost: summary.portfolio.netWorthAtCost,
    riskLevel: prefs.riskLevel,
    horizonYears: prefs.horizonYears,
    volatilityLimitPct: rules.VOLATILITY_LIMIT_PCT[prefs.riskLevel],
  };
}

const whatIf = (cost, netWorth) =>
  rules.WHAT_IF_MOVES_PCT.map((m) => ({
    movePct: m,
    effect: round2((cost * m) / 100),
    pctOfNetWorth: netWorth > 0 ? round2(((cost * m) / 100 / netWorth) * 100) : null,
  }));

function recentMove(f) {
  if (f.change5dPct == null) return null;
  const out = { stockPct: f.change5dPct, sectorPct: f.sectorChange5dPct ?? null, niftyPct: f.niftyChange5dPct ?? null, note: null };
  if (out.sectorPct !== null) {
    const diff = f.change5dPct - out.sectorPct;
    out.note = Math.abs(diff) <= rules.SECTOR_ALIGN_PCT
      ? 'Over the last 5 days the stock moved broadly in line with its sector.'
      : diff > 0 ? 'Over the last 5 days the stock did better than its sector.' : 'Over the last 5 days the stock did worse than its sector.';
  }
  return out;
}

const baseNotes = () => [
  'Fees, taxes and brokerage are not included.',
  'These checks compare numbers with your own settings. They are not a recommendation, and prices can move either way.',
];

// Shared cash / limit checks for a planned cost
function costChecks(cost, capacity) {
  const cashAfter = round2(capacity.cashNow - cost);
  return [
    chk('fits_capacity', 'Within your investable capacity', cost <= capacity.investableCapacity ? 'within' : 'outside',
      `Cost ${inr(cost)} vs investable capacity ${inr(capacity.investableCapacity)} (${pct(cost, capacity.investableCapacity) ?? 'n/a'}% used).`),
    chk('within_purchase_limit', `Within your per-purchase limit (${capacity.perPurchaseCapPct}% of capacity)`, cost <= capacity.perPurchaseLimit ? 'within' : 'outside',
      `Cost ${inr(cost)} vs limit ${inr(capacity.perPurchaseLimit)}.`),
    chk('emergency_fund_after', 'Cash stays above your emergency-fund target', cashAfter >= capacity.emergencyTarget ? 'within' : 'outside',
      `Cash after: ${inr(cashAfter)} vs target ${inr(capacity.emergencyTarget)}.`),
  ];
}

function checkStock({ facts, amount, capacity, holdings }) {
  const shares = Math.floor(amount / facts.price);
  const cost = round2(shares * facts.price);
  const numbers = { price: facts.price, priceAsOf: facts.priceAsOf, amountEntered: round2(amount), shares, estimatedCost: cost, feesIncluded: false };
  const checks = [];

  const age = ageDays(facts.priceAsOf);
  checks.push(chk('price_fresh', 'Price data is recent', age <= rules.MAX_PRICE_AGE_DAYS ? 'within' : 'outside',
    `Price is from ${facts.priceAsOf} (${age} day(s) old; flag after ${rules.MAX_PRICE_AGE_DAYS}).`));

  if (shares < 1) {
    checks.push(chk('affordability', 'Amount buys at least one share', 'outside', `${inr(amount)} is less than one share (${inr(facts.price)}).`));
    return { checks, numbers, whatIf: [], recentMove: recentMove(facts), notes: baseNotes() };
  }

  checks.push(...costChecks(cost, capacity));

  const held = holdings.find((h) => h.symbol === facts.symbol);
  const existing = held ? held.totalCost : 0;
  const weight = pct(existing + cost, capacity.portfolioCostBasis + cost);
  checks.push(chk('concentration_after', `Company stays under ${rules.CONCENTRATION_WARN_PCT}% of your portfolio`,
    weight <= rules.CONCENTRATION_WARN_PCT ? 'within' : 'outside',
    `After buying, ${facts.symbol} would be ${weight}% of your portfolio cost${held ? ` (you already hold ${inr(existing)})` : ''}.`));

  checks.push(facts.volatilityPct == null
    ? chk('volatility_vs_risk', 'Price swings within your risk setting', 'unknown', 'Volatility data not available.')
    : chk('volatility_vs_risk', `Price swings within your "${capacity.riskLevel}" risk setting`, facts.volatilityPct <= capacity.volatilityLimitPct ? 'within' : 'outside',
      `Yearly volatility ${facts.volatilityPct}% vs your limit ${capacity.volatilityLimitPct}%.`));

  numbers.cashAfter = round2(capacity.cashNow - cost);
  numbers.percentOfCapacity = pct(cost, capacity.investableCapacity);
  numbers.percentOfNetWorth = pct(cost, capacity.netWorthAtCost);
  return { checks, numbers, whatIf: whatIf(cost, capacity.netWorthAtCost), recentMove: recentMove(facts), notes: baseNotes() };
}

function checkIpo({ ipo, lots, capacity }) {
  const cost = round2(ipo.minAmount * lots);
  const numbers = {
    lots, lotSize: ipo.lotSize, sharesPerApplication: ipo.lotSize * lots, priceBandHigh: ipo.priceBandHigh,
    costOfOneLotAtUpperBand: ipo.minAmount, applicationAmount: cost,
    maxLotsWithinYourLimit: Math.floor(capacity.perPurchaseLimit / ipo.minAmount),
    cashAfterFundsBlocked: round2(capacity.cashNow - cost),
  };
  const checks = [];

  checks.push(chk('window', 'Bidding window', ipo.status === 'open' ? 'within' : ipo.status === 'upcoming' ? 'info' : 'outside',
    `Status: ${ipo.status}. Opens ${ipo.openDate}, closes ${ipo.closeDate}.`));
  checks.push(...costChecks(cost, capacity));
  checks.push(chk('retail_limit', `Within the retail-category ceiling (${inr(rules.RETAIL_IPO_LIMIT)})`, cost <= rules.RETAIL_IPO_LIMIT ? 'within' : 'outside',
    `Application amount ${inr(cost)}. Verify the current ceiling before launch.`));
  checks.push(chk('ipo_type', 'Issue type', 'info',
    ipo.type === 'sme' ? 'SME issue: usually a larger minimum amount and thinner trading than mainboard issues.' : 'Mainboard issue.'));

  return {
    checks, numbers, whatIf: whatIf(cost, capacity.netWorthAtCost),
    notes: [
      ...baseNotes(),
      'Allotment is not guaranteed. In oversubscribed issues many applicants receive nothing, and the blocked money is released after allotment.',
      'Listing price cannot be known in advance.',
      'The what-if table applies only if shares are allotted and the price then moves.',
    ],
  };
}

const SIZE_ORDER = { small: 0, mid: 1, large: 2 };

function screenStocks(universe, { capacity, holdings }, f = {}) {
  const maxVol = f.maxVolatility ?? capacity.volatilityLimitPct;
  const heldSymbols = new Set(holdings.map((h) => h.symbol));
  let list = universe.filter((s) =>
    (!s.symbol || !/^S000/.test(String(s.symbol))) &&
    (f.affordableOnly === false || s.price <= capacity.perPurchaseLimit) &&
    (f.excludeHeld === false || !heldSymbols.has(s.symbol)) &&
    (!f.sector || String(s.sector || '').toLowerCase() === String(f.sector).toLowerCase()) &&
    (!f.size || s.size === f.size) &&
    (s.volatilityPct != null && s.volatilityPct <= maxVol));

  const sorters = {
    name: (a, b) => a.name.localeCompare(b.name),
    price: (a, b) => a.price - b.price,
    volatility: (a, b) => a.volatilityPct - b.volatilityPct,
    size: (a, b) => SIZE_ORDER[a.size] - SIZE_ORDER[b.size],
  };
  const dir = f.order === 'desc' ? -1 : 1;
  list = [...list].sort((a, b) => dir * (sorters[f.sort] || sorters.name)(a, b));

  const items = list.map((s) => ({
    symbol: s.symbol, name: s.name, exchange: s.exchange, sector: s.sector, size: s.size,
    price: s.price, priceAsOf: s.priceAsOf, volatilityPct: s.volatilityPct, change5dPct: s.change5dPct,
    maxSharesWithinLimit: Math.floor(capacity.perPurchaseLimit / s.price),
    volatilityWithinRiskSetting: s.volatilityPct == null
      ? null
      : s.volatilityPct <= capacity.volatilityLimitPct,
  }));
  return { items, maxVolatilityUsed: maxVol };
}

function ipoListing(ipo, capacity) {
  return {
    id: ipo.id, name: ipo.name, type: ipo.type, status: ipo.status, industry: ipo.industry,
    openDate: ipo.openDate, closeDate: ipo.closeDate, allotmentDate: ipo.allotmentDate, listingDate: ipo.listingDate,
    priceBand: `${ipo.priceBandLow} - ${ipo.priceBandHigh}`, lotSize: ipo.lotSize, costOfOneLot: ipo.minAmount,
    issueSizeCr: ipo.issueSizeCr, subscription: ipo.subscription,
    oneLotWithinYourLimit: ipo.minAmount <= capacity.perPurchaseLimit,
    maxLotsWithinYourLimit: Math.floor(capacity.perPurchaseLimit / ipo.minAmount),
    asOf: ipo.asOf,
  };
}

module.exports = { buildCapacity, checkStock, checkIpo, screenStocks, ipoListing, round2, inr };
