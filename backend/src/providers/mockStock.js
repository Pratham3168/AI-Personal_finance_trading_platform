// SAMPLE DATA ONLY. All companies are fictional. Use it to build and test; never show it to real users.
const today = () => new Date().toISOString().slice(0, 10);
const SRC = 'MOCK sample data (fictional companies, not real market data)';

const rows = [
  // symbol, name, sector, size, price, high52, low52, vol, chg5d, sectorChg5d, pe
  ['SUNRISETECH', 'Sunrise Tech Ltd', 'IT', 'large', 2120, 2400, 1650, 28, -3.2, -3.0, 27],
  ['GREENPWR', 'GreenPower Ltd', 'Energy', 'mid', 300, 360, 210, 38, 1.2, -0.5, 22],
  ['ALPHABANK', 'AlphaBank Ltd', 'Banking', 'large', 850, 910, 700, 20, 0.4, 0.2, 14],
  ['BLUESTEEL', 'BlueSteel Industries', 'Metals', 'mid', 420, 520, 330, 33, -1.1, -1.4, 9],
  ['CITYRETAIL', 'CityRetail Ltd', 'Retail', 'large', 1800, 2050, 1500, 28, 0.9, 0.3, 45],
  ['DELTAPHARMA', 'DeltaPharma Ltd', 'Pharma', 'large', 640, 700, 520, 25, 0.1, 0.6, 24],
  ['EASTAUTO', 'EastAuto Ltd', 'Auto', 'large', 2600, 2900, 2100, 30, -0.7, -0.5, 19],
  ['FOODCORP', 'FoodCorp Ltd', 'FMCG', 'large', 310, 335, 270, 18, 0.2, 0.1, 38],
  ['NOVAINFRA', 'NovaInfra Ltd', 'Infrastructure', 'mid', 150, 190, 95, 45, -2.4, -0.8, 17],
  ['ORBITCHEM', 'OrbitChem Ltd', 'Chemicals', 'small', 95, 140, 60, 52, 3.5, 0.2, 31],
  ['PEAKHOTELS', 'PeakHotels Ltd', 'Hospitality', 'small', 220, 260, 150, 47, 0.8, 0.5, 40],
];

const toFacts = ([symbol, name, sector, size, price, high52w, low52w, volatilityPct, change5dPct, sectorChange5dPct, pe]) => ({
  symbol, name, exchange: 'NSE', sector, size, price, priceAsOf: today(), high52w, low52w, volatilityPct,
  change5dPct, sectorChange5dPct, niftyChange5dPct: -0.8, pe,
  announcements: symbol === 'SUNRISETECH' ? [{ date: today(), title: 'Quarterly results published (sample)', source: 'sample exchange filing' }] : [],
  dataSource: SRC,
});

exports.searchStocks = async (q) => {
  const s = String(q).toLowerCase();
  return rows.filter((r) => r[0].toLowerCase().includes(s) || r[1].toLowerCase().includes(s))
    .map((r) => ({ symbol: r[0], name: r[1], exchange: 'NSE', sector: r[2] }));
};
exports.getStockFacts = async (symbol) => {
  const r = rows.find((x) => x[0] === String(symbol).toUpperCase());
  return r ? toFacts(r) : null;
};
exports.getUniverseFacts = async () => rows.map(toFacts);
