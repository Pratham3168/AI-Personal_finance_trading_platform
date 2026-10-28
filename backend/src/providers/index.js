/*
 * DATA PROVIDER LAYER. The rest of the app only talks to these two interfaces.
 * To add a real API (e.g. Tapetide, IPOAlerts, Upstox) write one adapter file that returns the same shapes,
 * register it below, and switch with MARKET_PROVIDER / IPO_PROVIDER in .env. Nothing else changes.
 *
 * STOCK provider must implement:
 *   searchStocks(query)        -> [{ symbol, name, exchange, sector }]
 *   getStockFacts(symbol)      -> facts | null
 *   getUniverseFacts()         -> [facts]   (the list the screener filters)
 *   facts = { symbol, name, exchange, sector, size:'small|mid|large', price, priceAsOf:'YYYY-MM-DD',
 *             high52w, low52w, volatilityPct, change5dPct, sectorChange5dPct, niftyChange5dPct, pe,
 *             announcements:[{date,title,source}], dataSource }
 *
 * IPO provider must implement:
 *   listIpos()                 -> [ipo]
 *   getIpo(id)                 -> ipo | null
 *   ipo = { id, name, type:'mainboard|sme', status:'upcoming|open|closed|listed', industry, openDate, closeDate,
 *           allotmentDate, listingDate, priceBandLow, priceBandHigh, lotSize, minAmount, issueSizeCr,
 *           subscription:{qib,nii,retail,total,asOf}, registrar, asOf, dataSource }
 *   (GMP is deliberately not part of this shape.)
 */
const stockProviders = { mock: require('./mockStock'), indianapi: require('./indianapi') };
const ipoProviders = { mock: require('./mockIpo'), indianapi: require('./indianapi') };

function pick(map, name, label) {
  const p = map[name];
  if (!p) throw Object.assign(new Error(`Unknown ${label} provider "${name}". Available: ${Object.keys(map).join(', ')}`), { status: 500 });
  return p;
}

exports.stockProvider = () => pick(stockProviders, process.env.MARKET_PROVIDER || 'mock', 'market');
exports.ipoProvider = () => pick(ipoProviders, process.env.IPO_PROVIDER || 'mock', 'IPO');
