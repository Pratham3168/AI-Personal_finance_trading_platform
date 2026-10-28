// PLACEHOLDER RULES: starting points, not standards. Every number here is adjustable.
module.exports = {
  VOLATILITY_LIMIT_PCT: { low: 25, medium: 35, high: 50 }, // yearly price swing (%) allowed per risk level
  DEFAULT_PER_PURCHASE_CAP_PCT: 50,   // one purchase may use up to this % of investable capacity
  DEFAULT_HORIZON_YEARS: 3,
  CONCENTRATION_WARN_PCT: 40,         // one company above this % of portfolio cost is flagged
  MAX_PRICE_AGE_DAYS: 4,              // older price data is flagged
  SECTOR_ALIGN_PCT: 1.5,              // 5-day move within this many points of the sector = "in line"
  WHAT_IF_MOVES_PCT: [-20, -10, 10, 20],
  RETAIL_IPO_LIMIT: 200000,           // retail-category application ceiling (verify before launch)
};
