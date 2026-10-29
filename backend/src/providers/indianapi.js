/**
 * Adapter for stock.indianapi.in
 * Field names confirmed from live terminal logs on 2026-10-28.
 *
 * /trending  -> { trending_stocks: { top_gainers: [{ticker_id, company_name, price(str), percent_change, high, low, volume, date}] } }
 * /NSE_most_active -> [{ticker, company, price(num), percent_change, net_change, high, low, open, close, volume, overall_rating}]
 * /stock?name=X -> fetched per company for detail check
 * /ipo -> currently returning 500 on their server (not our problem)
 *
 * IMPORTANT: verify indianapi.in commercial terms before showing data to your users.
 * Free tier: 500 requests/month.
 */

const https = require('https');

const BASE = (process.env.INDIAN_API_BASE_URL || 'https://stock.indianapi.in').replace(/\/$/, '');
const KEY = () => {
  if (!process.env.INDIANAPI_KEY) throw Object.assign(new Error('INDIANAPI_KEY is not set in .env'), { status: 500 });
  return process.env.INDIANAPI_KEY;
};
const today = () => new Date().toISOString().slice(0, 10);
const num = (v) => parseFloat(v) || null;
let universeCache = null;
let universeCacheExpiresAt = 0;
const UNIVERSE_CACHE_TTL_MS = 5 * 60 * 1000;

function get(path) {
  return new Promise((resolve, reject) => {
    const url = `${BASE}${path}`;
    const opts = { headers: { 'x-api-key': KEY(), Accept: 'application/json' }, timeout: 15000 };
    https.get(url, opts, (res) => {
      let raw = '';
      res.on('data', (d) => (raw += d));
      res.on('end', () => {
        try {
          const body = JSON.parse(raw);
          if (res.statusCode === 401 || res.statusCode === 403)
            return reject(Object.assign(new Error('indianapi rejected the API key. Check INDIANAPI_KEY in .env'), { status: 502 }));
          if (res.statusCode === 429)
            return reject(Object.assign(new Error('indianapi rate limit hit. Monthly quota may be exhausted.'), { status: 503 }));
          if (res.statusCode >= 400)
            return reject(Object.assign(new Error(`indianapi error ${res.statusCode}: ${JSON.stringify(body).slice(0, 120)}`), { status: 502 }));
          resolve(body);
        } catch {
          reject(Object.assign(new Error(`indianapi returned non-JSON (status ${res.statusCode}): ${raw.slice(0, 80)}`), { status: 502 }));
        }
      });
    })
      .on('timeout', () => reject(Object.assign(new Error('indianapi request timed out'), { status: 504 })))
      .on('error', (e) => reject(Object.assign(new Error(`indianapi network error: ${e.message}`), { status: 502 })));
  });
}

// Volatility proxy from 52w range (not a true stddev, but usable for screening)
function calcVolatility(high52, low52) {
  if (!high52 || !low52 || low52 <= 0) return null;
  return Math.round(((high52 - low52) / low52) * 50);
}

// Size bucket from market cap (crores)
function sizeFromCap(capCr) {
  const c = num(capCr) || 0;
  return c > 20000 ? 'large' : c > 5000 ? 'mid' : 'small';
}

// ----- NSE_most_active row -----
// { ticker, company, price, percent_change, high, low, open, close, volume, overall_rating }
function fromNseActive(d) {
  if (!d || typeof d !== 'object') return null;
  const price = num(d.price);
  if (!price) return null;
  const high52 = num(d.high) || null;
  const low52  = num(d.low) || null;
  return {
    symbol: String(d.ticker || '').toUpperCase(),
    name: d.company || d.ticker || 'Unknown',
    exchange: 'NSE',
    sector: d.sector || null,
    size: 'unknown',
    price,
    priceAsOf: today(),
    high52w: high52,
    low52w: low52,
    volatilityPct: calcVolatility(high52, low52),
    change5dPct: null,   // only daily change available here
    changeDayPct: num(d.percent_change),
    sectorChange5dPct: null,
    niftyChange5dPct: null,
    pe: null,
    announcements: [],
    dataSource: 'indianapi.in NSE_most_active (real market data)',
  };
}

// ----- /trending top_gainers row -----
// { ticker_id, company_name, price(str), percent_change, high, low, volume, date }
function fromTrending(d) {
  if (!d || typeof d !== 'object') return null;
  const price = num(d.price);
  if (!price) return null;
  const high52 = num(d.high) || null;
  const low52  = num(d.low) || null;
  return {
    symbol: String(d.ticker_id || d.symbol || '').toUpperCase(),
    name: d.company_name || d.company || d.ticker_id || 'Unknown',
    exchange: 'NSE',
    sector: d.sector || null,
    size: 'unknown',
    price,
    priceAsOf: d.date || today(),
    high52w: high52,
    low52w: low52,
    volatilityPct: calcVolatility(high52, low52),
    change5dPct: null,
    changeDayPct: num(d.percent_change),
    sectorChange5dPct: null,
    niftyChange5dPct: null,
    pe: null,
    announcements: [],
    dataSource: 'indianapi.in trending (real market data)',
  };
}

// ----- /stock?name=X detail row -----
// { companyName, currentPrice, stockTechnicalData:{...}, stockMetaData:{...}, ... }
function fromStockDetail(d, fallbackSymbol) {
  if (!d || typeof d !== 'object') return null;
  const meta = d.stockMetaData || d.metadata || {};
  const reusable = d.stockDetailsReusableData || {};
  const rawPrice = d.currentPrice || d.price || d.lastPrice || d.close || reusable.price;
  const price = typeof rawPrice === 'object'
    ? num(rawPrice.NSE || rawPrice.nse || rawPrice.BSE || rawPrice.bse)
    : num(rawPrice);
  if (!price) return null;
  const tech = Array.isArray(d.stockTechnicalData) ? {} : (d.stockTechnicalData || d.technicals || {});
  const high52 = num(d['52WeekHigh'] || d.yearHigh || d.high52Week || reusable.yhigh || tech['52WeekHigh']) || null;
  const low52  = num(d['52WeekLow'] || d.yearLow || d.low52Week || reusable.ylow || tech['52WeekLow']) || null;
  let vol = num(d.volatility || d.annualisedVolatility) || null;
  if (!vol) vol = calcVolatility(high52, low52);
  const sector = d.sector || d.industry || meta.sector || meta.industry || meta.industryName || null;
  return {
    symbol: String(d.symbol || d.ticker || fallbackSymbol || '').toUpperCase(),
    name: d.companyName || d.name || meta.companyName || fallbackSymbol,
    exchange: String(d.exchange || 'NSE').toUpperCase().includes('BSE') ? 'BSE' : 'NSE',
    sector,
    size: sizeFromCap(d.marketCap || reusable.marketCap || meta.marketCap),
    price,
    priceAsOf: today(),
    high52w: high52,
    low52w: low52,
    volatilityPct: vol,
    change5dPct: num(d.change5d || d.fiveDayChange || reusable.price5DayPercentChange) || null,
    changeDayPct: num(d.percentChange || d.change || reusable.percentChange) || null,
    sectorChange5dPct: null,
    niftyChange5dPct: null,
    pe: num(d.pe || d.peRatio || tech.pe) || null,
    announcements: [],
    dataSource: 'indianapi.in /stock (real market data)',
  };
}

// ----- IPO -----
function ipoToShape(d) {
  if (!d || typeof d !== 'object') return null;
  const status = String(d.status || d.ipoStatus || 'upcoming').toLowerCase();
  const high = num(d.maxPrice || d.priceHigh || d.priceMax || d.issuePrice) || 0;
  const low  = num(d.minPrice || d.priceLow  || d.priceMin) || high;
  const lot  = parseInt(d.lotSize || d.minLotSize || d.minBidQty || 1, 10);
  const slug = String(d.symbol || d.ticker || d.companyName || Math.random()).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return {
    id: slug,
    name: d.companyName || d.name || 'Unknown',
    type: String(d.type || d.ipoType || 'mainboard').toLowerCase().includes('sme') ? 'sme' : 'mainboard',
    status: ['open', 'upcoming', 'closed', 'listed'].includes(status) ? status : 'upcoming',
    industry: d.industry || d.sector || null,
    openDate: d.openDate || d.bidOpenDate || d.startDate || null,
    closeDate: d.closeDate || d.bidCloseDate || d.endDate || null,
    allotmentDate: d.allotmentDate || d.basisOfAllotmentDate || null,
    listingDate: d.listingDate || d.listDate || null,
    priceBandLow: low,
    priceBandHigh: high,
    lotSize: lot,
    minAmount: high * lot,
    issueSizeCr: num(d.issueSize || d.totalIssueSize) || null,
    subscription: d.subscriptionStatus
      ? { qib: d.subscriptionStatus.qib || 0, nii: d.subscriptionStatus.nii || 0, retail: d.subscriptionStatus.retail || 0, total: d.subscriptionStatus.total || 0, asOf: today() }
      : null,
    registrar: d.registrar || d.registrarName || null,
    asOf: today(),
    dataSource: 'indianapi.in /ipo (real IPO data)',
  };
}

// ============ public interface ============

exports.searchStocks = async (query) => {
  const clean = String(query).replace(/\.(NS|BO|BSE|NSE)$/i, '').trim();
  try {
    const d = await get(`/stock?name=${encodeURIComponent(clean)}`);
    const f = fromStockDetail(d, clean);
    return f ? [{ symbol: f.symbol, name: f.name, exchange: f.exchange, sector: f.sector }] : [];
  } catch (e) {
    console.error('indianapi searchStocks error:', e.message);
    return [];
  }
};

exports.getStockFacts = async (symbol) => {
  const clean = String(symbol).replace(/\.(NS|BO|BSE|NSE)$/i, '').trim();

  // Warm the cache if empty so name lookup works even on a direct /check call (e.g. from Postman)
  if (!universeCache || Date.now() >= universeCacheExpiresAt) {
    try { await exports.getUniverseFacts(); } catch (e) { /* ignore, fall through to direct lookup */ }
  }

  // Step 1: find company name from cache (BRTI.NS -> "Bharti Airtel" -> /stock?name=Bharti Airtel)
  if (universeCache) {
    const cached = universeCache.find(
      (s) => s.symbol === String(symbol).toUpperCase() ||
              s.symbol === clean.toUpperCase() ||
              String(s.name).toLowerCase() === clean.toLowerCase()
    );
    if (cached) {
      try {
        const d = await get(`/stock?name=${encodeURIComponent(cached.name)}`);
        const f = fromStockDetail(d, cached.symbol);
        if (f && f.price) return f;
      } catch (e) { if (e.status >= 500) throw e; }
    }
  }

  // Step 2: try clean ticker (BRTI)
  try {
    const d = await get(`/stock?name=${encodeURIComponent(clean)}`);
    const f = fromStockDetail(d, clean);
    if (f && f.price) return f;
  } catch (e) { if (e.status >= 500) throw e; }

  // Step 3: try original as-is (handles full company names like "Bharti Airtel")
  const d = await get(`/stock?name=${encodeURIComponent(symbol)}`);
  return fromStockDetail(d, symbol);
};

exports.getUniverseFacts = async () => {
  const [trending, nseActive] = await Promise.allSettled([
    get('/trending'),
    get('/NSE_most_active'),
  ]);

  const facts = [];

  // /trending -> { trending_stocks: { top_gainers: [...], top_losers: [...] } }
  if (trending.status === 'fulfilled' && trending.value) {
    const ts = trending.value.trending_stocks || {};
    for (const key of ['top_gainers', 'top_losers', 'most_active']) {
      const arr = ts[key];
      if (Array.isArray(arr)) arr.forEach((s) => { const f = fromTrending(s); if (f && f.symbol) facts.push(f); });
    }
    // flat array fallback
    if (Array.isArray(trending.value)) trending.value.forEach((s) => { const f = fromTrending(s); if (f && f.symbol) facts.push(f); });
  }

  // /NSE_most_active -> [...]
  if (nseActive.status === 'fulfilled') {
    const arr = Array.isArray(nseActive.value) ? nseActive.value : (nseActive.value?.data || []);
    arr.forEach((s) => { const f = fromNseActive(s); if (f && f.symbol) facts.push(f); });
  }

  // Deduplicate by symbol, keeping the entry with more data
  const map = new Map();
  for (const f of facts) {
    const existing = map.get(f.symbol);
    if (!existing || (f.pe && !existing.pe)) map.set(f.symbol, f);
  }
  const universe = [...map.values()];
  universeCache = universe;
  universeCacheExpiresAt = Date.now() + UNIVERSE_CACHE_TTL_MS;
  return universe;
};

exports.listIpos = async () => {
  try {
    const d = await get('/ipo');
    const arr = Array.isArray(d) ? d : (d.ipos || d.data || d.ipo || []);
    return arr.map(ipoToShape).filter(Boolean);
  } catch (e) {
    console.error('indianapi /ipo error:', e.message, '(their server may be down)');
    return [];
  }
};

exports.getIpo = async (id) => {
  const all = await exports.listIpos();
  return all.find((i) => i.id === id) || null;
};
