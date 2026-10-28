const { InvestorProfile, InvestorPreferences } = require('../models');
const { buildInvestmentSummary, loadLedger } = require('./investmentService');
const { currentMonth } = require('../utils/aggregate');
const { replay, summarisePositions } = require('../utils/ledger');
const { buildCapacity } = require('../utils/fitChecks');
const rules = require('../config/investmentRules');

const DEFAULT_PREFS = { reservedAmount: 0, perPurchaseCapPct: rules.DEFAULT_PER_PURCHASE_CAP_PCT, horizonYears: rules.DEFAULT_HORIZON_YEARS };

exports.getPreferences = async (userId) => {
  const p = await InvestorPreferences.findOne({ where: { userId }, raw: true });
  return p ? { reservedAmount: Number(p.reservedAmount), perPurchaseCapPct: p.perPurchaseCapPct, horizonYears: p.horizonYears } : { ...DEFAULT_PREFS };
};

// Everything the checks need about the user's money, assembled from existing calculations
exports.getContext = async (userId) => {
  const summary = await buildInvestmentSummary(userId, currentMonth()); // throws 409 if no profile yet
  const profile = await InvestorProfile.findOne({ where: { userId }, raw: true });
  const prefs = await exports.getPreferences(userId);
  const ledger = await loadLedger(userId);
  const holdings = summarisePositions(replay(ledger).positions).holdings;
  const capacity = buildCapacity(summary, { ...prefs, riskLevel: profile.riskLevel });
  return { capacity, holdings, summary };
};
